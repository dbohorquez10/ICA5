import os
import re

files_to_process = [
    "src/app/features/tecnico/historial-inspecciones/historial-inspecciones.component.ts",
    "src/app/features/tecnico/ejecutar-inspeccion/ejecutar-inspeccion.component.ts",
    "src/app/features/admin/gestion-usuarios/gestion-usuarios.component.ts",
    "src/app/features/admin/configuracion/configuracion.component.ts",
    "src/app/features/admin/dashboard-admin/dashboard-admin.component.ts",
    "src/app/features/productor/solicitar-inspeccion/solicitar-inspeccion.component.ts",
    "src/app/features/productor/reportes/reportes.component.ts",
    "src/app/features/productor/mis-predios/mis-predios.component.ts"
]

base_dir = "/home/darwing/FitoGestionFE"

for fpath in files_to_process:
    full_path = os.path.join(base_dir, fpath)
    if not os.path.exists(full_path):
        continue
        
    with open(full_path, "r") as f:
        content = f.read()
        
    # Correct import path
    content = re.sub(r"import \{ NotificationService \} from '.*?/core/services/notification\.service';", "import { NotificationService } from '../../../core/services/notification.service';", content)
    
    # Correct type errors in try-catch or arrow functions
    content = content.replace("this.notify.showError(err.error?.detail", "this.notify.showError((err as any).error?.detail")
    content = content.replace("this.notify.showError(err.message", "this.notify.showError((err as any).message")
    content = content.replace("err => this.notify.showError(", "(err: any) => this.notify.showError(")
    
    # In try-catch block for async/await, err is unknown
    content = re.sub(r'catch\s*\(\s*err\s*\)\s*\{', r'catch (err: any) {', content)
    
    with open(full_path, "w") as f:
        f.write(content)

print("Fix 2 complete")
