import os
import glob

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return False
        
    new_lines = []
    in_conflict = False
    in_head = False
    in_other = False
    changed = False
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            in_conflict = True
            in_head = True
            changed = True
            continue
        elif line.startswith('======='):
            if in_conflict:
                in_head = False
                in_other = True
                continue
            else:
                new_lines.append(line)
        elif line.startswith('>>>>>>> '):
            if in_conflict:
                in_conflict = False
                in_other = False
                continue
            else:
                new_lines.append(line)
        else:
            if in_conflict:
                if in_head:
                    new_lines.append(line)
            else:
                new_lines.append(line)
            
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Fixed {filepath}")
        return True
    return False

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', '.vercel', 'supabase']]
    for file in files:
        if file.endswith(('.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.cjs', '.html', '.css', '.apex')):
            process_file(os.path.join(root, file))
