import json
import sys

def build_notebook(py_file, ipynb_file):
    with open(py_file, 'r', encoding='utf-8') as f:
        lines = f.read().split('\n')
    
    cells = []
    current_cell = {'type': 'code', 'source': []}
    in_md = False
    
    for l in lines:
        if l.startswith('\"\"\"') and not in_md:
            if any(s.strip() for s in current_cell['source']):
                cells.append({'cell_type': current_cell['type'], 'metadata': {'id': str(len(cells))}, 'source': [x+'\n' for x in current_cell['source']]})
            current_cell = {'type': 'markdown', 'source': []}
            in_md = True
            if len(l) > 3:
                current_cell['source'].append(l[3:])
        elif l.endswith('\"\"\"') and in_md:
            if len(l) > 3:
                current_cell['source'].append(l[:-3])
            if any(s.strip() for s in current_cell['source']):
                cells.append({'cell_type': current_cell['type'], 'metadata': {'id': str(len(cells))}, 'source': [x+'\n' for x in current_cell['source']]})
            current_cell = {'type': 'code', 'source': []}
            in_md = False
        else:
            current_cell['source'].append(l)
            
    if any(s.strip() for s in current_cell['source']):
        cells.append({'cell_type': current_cell['type'], 'metadata': {'id': str(len(cells))}, 'source': [x+'\n' for x in current_cell['source']]})
        
    notebook = {
        'nbformat': 4,
        'nbformat_minor': 0,
        'metadata': {'colab': {'provenance': []}},
        'cells': cells
    }
    
    with open(ipynb_file, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2)

if __name__ == "__main__":
    build_notebook('notebooks/apex_master_finetune_colab.py', 'notebooks/apex_master_finetune_colab.ipynb')
