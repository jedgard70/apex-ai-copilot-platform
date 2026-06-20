import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_ai/firebase_ai.dart';
import 'package:image_picker/image_picker.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await FirebaseAuth.instance.signInAnonymously();
  runApp(const FlutterAIApp());
}

class FlutterAIApp extends StatelessWidget {
  const FlutterAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Flutter',
      theme: ThemeData(
        brightness: Brightness.dark,
        useMaterial3: true,
        colorSchemeSeed: Colors.indigo,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _textController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  final List<ChatMessage> _messages = [];
  File? _selectedImage;
  String? _generatedImageBase64;

  late final GenerativeModel _textModel;
  late final GenerativeModel _imageModel;

  @override
  void initState() {
    super.initState();
    final googleAI = FirebaseAI.googleAI(auth: FirebaseAuth.instance);

    _textModel = googleAI.generativeModel(
      model: 'gemini-2.5-flash',
      generationConfig: GenerationConfig(
        temperature: 0.7,
        maxOutputTokens: 2048,
      ),
    );

    _imageModel = googleAI.generativeModel(
      model: 'gemini-2.5-flash',
      generationConfig: GenerationConfig(
        responseModalities: [ResponseModality.text, ResponseModality.image],
      ),
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _sendTextMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _textController.clear();

    setState(() {
      _messages.add(ChatMessage(role: 'user', text: text));
    });

    try {
      final parts = <ContentPart>[ContentPart.text(text)];
      if (_selectedImage != null) {
        final bytes = await _selectedImage!.readAsBytes();
        parts.add(
          ContentPart.inlineData(
            InlineData(
              data: base64Encode(bytes),
              mimeType: 'image/jpeg',
            ),
          ),
        );
        _selectedImage = null;
      }

      final streamingMessage = ChatMessage(role: 'model', text: '');
      setState(() => _messages.add(streamingMessage));

      final stream = _textModel.generateContentStream(
        [Content(role: 'user', parts: parts)],
      );

      String accumulated = '';
      await for (final chunk in stream) {
        final chunkText = chunk.text;
        if (chunkText != null) {
          accumulated += chunkText;
          setState(() => streamingMessage.text = accumulated);
        }
      }
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(role: 'model', text: 'Error: $e'));
      });
    }
  }

  Future<void> _generateImage() async {
    final prompt = _textController.text.trim();
    if (prompt.isEmpty) return;
    _textController.clear();

    setState(() {
      _messages.add(ChatMessage(role: 'user', text: 'Generate image: $prompt'));
    });

    try {
      final result = await _imageModel.generateContent(
        [Content(role: 'user', parts: [ContentPart.text(prompt)])],
      );

      final inlineDataParts = result.inlineDataParts;
      if (inlineDataParts.isNotEmpty) {
        final data = inlineDataParts.first.inlineData;
        setState(() {
          _generatedImageBase64 = data.data;
          _messages.add(
            ChatMessage(
              role: 'model',
              text: 'Generated image (${data.mimeType})',
              imageBase64: data.data,
            ),
          );
        });
      } else {
        setState(() {
          _messages.add(ChatMessage(role: 'model', text: result.text ?? 'No image generated'));
        });
      }
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(role: 'model', text: 'Image generation error: $e'));
      });
    }
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      setState(() => _selectedImage = File(file.path));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Flutter — Gemini + Nano Banana'),
        actions: [
          IconButton(
            icon: const Icon(Icons.image),
            tooltip: 'Generate Image (Nano Banana)',
            onPressed: _generateImage,
          ),
          IconButton(
            icon: const Icon(Icons.photo_library),
            tooltip: 'Attach image for multimodal',
            onPressed: _pickImage,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.role == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser
                          ? Theme.of(context).colorScheme.primaryContainer
                          : Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.8,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (msg.text.isNotEmpty)
                          Text(msg.text, style: const TextStyle(fontSize: 15)),
                        if (msg.imageBase64 != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Image.memory(
                              base64Decode(msg.imageBase64!),
                              height: 200,
                              fit: BoxFit.contain,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (_selectedImage != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: Row(
                children: [
                  Image.file(_selectedImage!, height: 48, width: 48, fit: BoxFit.cover),
                  const SizedBox(width: 8),
                  const Text('Image attached for multimodal analysis'),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).colorScheme.outlineVariant,
                ),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Ask anything or describe an image to generate...',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onSubmitted: (_) => _sendTextMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sendTextMessage,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ChatMessage {
  final String role;
  String text;
  final String? imageBase64;

  ChatMessage({
    required this.role,
    required this.text,
    this.imageBase64,
  });
}
