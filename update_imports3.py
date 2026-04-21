import os

def replace_in_file(filepath, old, new):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()
    if old in content:
        new_content = content.replace(old, new)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# 1. main.ts
replace_in_file('src/main.ts', "'./app/app-module'", "'./app/app.module'")

# 2. app.module.server.ts
replace_in_file('src/app/app.module.server.ts', "import { App } from './app';", "import { AppComponent } from './app.component';")
replace_in_file('src/app/app.module.server.ts', "bootstrap: [App]", "bootstrap: [AppComponent]")

# 3. layout-routing.module.ts
replace_in_file('src/app/layout/layout-routing.module.ts', "'../../core/guards/role.guard'", "'../core/guards/role.guard'")

# 4. dashboard.component.ts
replace_in_file('src/app/layout/dashboard/dashboard.component.ts', "'../../../core/services/auth.service'", "'../../core/services/auth.service'")
