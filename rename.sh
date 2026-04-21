#!/bin/bash
cd /home/darwing/FitoGestionFE/src/app

# Renombrar root
[ -f "app.ts" ] && mv app.ts app.component.ts
[ -f "app.html" ] && mv app.html app.component.html
[ -f "app.css" ] && mv app.css app.component.css
[ -f "app.spec.ts" ] && mv app.spec.ts app.component.spec.ts
[ -f "app-module.ts" ] && mv app-module.ts app.module.ts
[ -f "app-routing-module.ts" ] && mv app-routing-module.ts app-routing.module.ts

# Mover layout de shared a app/layout
if [ -d "shared/layout" ]; then
    mkdir -p layout
    mv shared/layout/* layout/ 2>/dev/null
    rmdir shared/layout 2>/dev/null
fi

# Renombrar module y routing en layout
[ -f "layout/layout-module.ts" ] && mv layout/layout-module.ts layout/layout.module.ts
[ -f "layout/layout-routing-module.ts" ] && mv layout/layout-routing-module.ts layout/layout-routing.module.ts

# Función para renombrar componentes (ts, html, css, spec)
rename_component() {
    local dir=$1
    local name=$2
    [ -f "$dir/$name.ts" ] && mv "$dir/$name.ts" "$dir/$name.component.ts"
    [ -f "$dir/$name.html" ] && mv "$dir/$name.html" "$dir/$name.component.html"
    [ -f "$dir/$name.css" ] && mv "$dir/$name.css" "$dir/$name.component.css"
    [ -f "$dir/$name.spec.ts" ] && mv "$dir/$name.spec.ts" "$dir/$name.component.spec.ts"
}

# Layout dashboard
rename_component "layout/dashboard" "dashboard"

# Shared components
rename_component "shared/components/panel-general" "panel-general"

# Features Modules
for feature in admin auth landing productor tecnico; do
    [ -f "features/$feature/$feature-module.ts" ] && mv "features/$feature/$feature-module.ts" "features/$feature/$feature.module.ts"
    [ -f "features/$feature/$feature-routing-module.ts" ] && mv "features/$feature/$feature-routing-module.ts" "features/$feature/$feature-routing.module.ts"
done

# Auth components
rename_component "features/auth/login" "login"
rename_component "features/auth/registro" "registro"

# Admin components
rename_component "features/admin/gestion-usuarios" "gestion-usuarios"

# Landing components
rename_component "features/landing/home" "home"

# Productor components
rename_component "features/productor/mis-predios" "mis-predios"
rename_component "features/productor/reportes" "reportes"
rename_component "features/productor/solicitar-inspeccion" "solicitar-inspeccion"

# Tecnico components
rename_component "features/tecnico/ejecutar-inspeccion" "ejecutar-inspeccion"
rename_component "features/tecnico/inspecciones" "inspecciones"

echo "Renombrado completado."
