# -*- coding: utf-8 -*-
__persistentengine__ = True

import json
import traceback
from Queue import Queue

import clr
clr.AddReference("System")

from System import Object
from System.IO import StreamReader
from System.Net import HttpListener
from System.Text import Encoding
from System.Threading import ManualResetEvent, Thread, ThreadStart

from Autodesk.Revit.DB import FilteredElementCollector, View
from Autodesk.Revit.UI import IExternalEventHandler, ExternalEvent, TaskDialog


HOST = "http://127.0.0.1:8765/"

_requests = Queue()
_listener = None
_thread = None
_external_event = None


class RpcRequest(object):
    def __init__(self, command, payload):
        self.command = command
        self.payload = payload or {}
        self.result = None
        self.error = None
        self.done = ManualResetEvent(False)


class RpcHandler(IExternalEventHandler):
    def Execute(self, app):
        while not _requests.empty():
            item = _requests.get()
            try:
                item.result = run_revit_command(app, item.command, item.payload)
            except Exception:
                item.error = traceback.format_exc()
            finally:
                item.done.Set()

    def GetName(self):
        return "Codex MCP Revit RPC Handler"


def map_get(data, key, default=None):
    if data is None:
        return default
    try:
        return data.get(key, default)
    except AttributeError:
        try:
            if data.ContainsKey(key):
                return data[key]
        except Exception:
            pass
    return default


def run_revit_command(app, command, payload):
    uidoc = app.ActiveUIDocument
    if uidoc is None:
        raise Exception("Nenhum documento ativo no Revit.")

    doc = uidoc.Document

    if command == "ping":
        return {"status": "ok", "document": doc.Title}

    if command == "active_document":
        return {
            "title": doc.Title,
            "path": doc.PathName,
            "is_family_document": doc.IsFamilyDocument,
            "is_workshared": doc.IsWorkshared,
        }

    if command == "list_views":
        limit = int(map_get(payload, "limit", 100))
        views = []
        collector = FilteredElementCollector(doc).OfClass(View)
        for view in collector:
            if view.IsTemplate:
                continue
            views.append({
                "id": view.Id.IntegerValue,
                "name": view.Name,
                "view_type": str(view.ViewType),
            })
            if len(views) >= limit:
                break
        return views

    if command == "selection":
        selected = []
        ids = uidoc.Selection.GetElementIds()
        for element_id in ids:
            element = doc.GetElement(element_id)
            category = element.Category.Name if element.Category else None
            selected.append({
                "id": element.Id.IntegerValue,
                "name": element.Name,
                "category": category,
            })
        return selected

    raise Exception("Comando desconhecido: {}".format(command))


def read_json_request(context):
    request = context.Request
    if not request.HasEntityBody:
        return {}

    reader = StreamReader(request.InputStream, request.ContentEncoding)
    try:
        body = reader.ReadToEnd()
    finally:
        reader.Close()

    if not body:
        return {}
    return json.loads(body)


def write_json_response(context, status_code, payload):
    text = json.dumps(payload)
    data = Encoding.UTF8.GetBytes(text)
    response = context.Response
    response.StatusCode = status_code
    response.ContentType = "application/json; charset=utf-8"
    response.ContentLength64 = data.Length
    response.OutputStream.Write(data, 0, data.Length)
    response.OutputStream.Close()


def execute_rpc(command, payload):
    item = RpcRequest(command, payload)
    _requests.put(item)
    _external_event.Raise()
    if not item.done.WaitOne(10000):
        return {"ok": False, "error": "Timeout esperando o Revit executar o comando. Verifique se nao ha dialogos/modais abertos no Revit."}

    if item.error:
        return {"ok": False, "error": item.error}
    return {"ok": True, "result": item.result}


def serve():
    global _listener

    while _listener is not None and _listener.IsListening:
        try:
            context = _listener.GetContext()
            path = context.Request.Url.AbsolutePath

            if path == "/health":
                write_json_response(context, 200, {"ok": True, "result": "listening"})
                continue

            if path != "/rpc":
                write_json_response(context, 404, {"ok": False, "error": "Not found"})
                continue

            body = read_json_request(context)
            command = map_get(body, "command")
            payload = map_get(body, "payload", {}) or {}

            if command == "shutdown":
                write_json_response(context, 200, {"ok": True, "result": "stopping"})
                stop_listener()
                break

            result = execute_rpc(command, payload)
            write_json_response(context, 200, result)
        except Exception:
            try:
                write_json_response(
                    context,
                    500,
                    {"ok": False, "error": traceback.format_exc()},
                )
            except Exception:
                pass


def start_listener():
    global _listener, _thread, _external_event

    if _listener is not None and _listener.IsListening:
        TaskDialog.Show("Codex MCP", "Listener ja esta ativo em {}".format(HOST))
        return

    _external_event = ExternalEvent.Create(RpcHandler())
    _listener = HttpListener()
    _listener.Prefixes.Add(HOST)
    try:
        _listener.Start()
    except Exception as exc:
        _listener = None
        TaskDialog.Show(
            "Codex MCP",
            "Listener ja parece estar ativo em {}\n\n{}".format(HOST, exc),
        )
        return

    _thread = Thread(ThreadStart(serve))
    _thread.IsBackground = True
    _thread.Start()

    TaskDialog.Show("Codex MCP", "Listener iniciado em {}".format(HOST))


def stop_listener():
    global _listener

    if _listener is not None:
        try:
            _listener.Stop()
            _listener.Close()
        except Exception:
            pass
        _listener = None


start_listener()







