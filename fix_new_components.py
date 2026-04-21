import os
import re

def fix_component_file(path):
    if not os.path.exists(path): return
    with open(path, 'r') as f:
        content = f.read()
    
    # fix templateUrl and styleUrl
    content = re.sub(r"templateUrl: '\./(.*)\.html'", r"templateUrl: './\1.component.html'", content)
    content = re.sub(r"styleUrls: \['\./(.*)\.css'\]", r"styleUrls: ['./\1.component.css']", content)
    content = re.sub(r"styleUrl: '\./(.*)\.css'", r"styleUrl: './\1.component.css'", content)
    
    with open(path, 'w') as f:
        f.write(content)

def fix_module_file(path):
    if not os.path.exists(path): return
    with open(path, 'r') as f:
        content = f.read()
    
    # fix imports
    content = content.replace("from './historial-inspecciones/historial-inspecciones';", "from './historial-inspecciones/historial-inspecciones.component';")
    content = content.replace("from './dashboard-admin/dashboard-admin';", "from './dashboard-admin/dashboard-admin.component';")
    content = content.replace("from './configuracion/configuracion';", "from './configuracion/configuracion.component';")
    
    with open(path, 'w') as f:
        f.write(content)

fix_component_file('src/app/features/tecnico/historial-inspecciones/historial-inspecciones.component.ts')
fix_component_file('src/app/features/admin/dashboard-admin/dashboard-admin.component.ts')
fix_component_file('src/app/features/admin/configuracion/configuracion.component.ts')

fix_module_file('src/app/features/tecnico/tecnico.module.ts')
fix_module_file('src/app/features/admin/admin.module.ts')
