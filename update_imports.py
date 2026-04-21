import os
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content

    # 1. Update templateUrl
    new_content = re.sub(r"templateUrl:\s*'\./([a-zA-Z0-9_-]+)\.html'", r"templateUrl: './\1.component.html'", new_content)
    
    # 2. Update styleUrl(s)
    new_content = re.sub(r"styleUrl:\s*'\./([a-zA-Z0-9_-]+)\.css'", r"styleUrl: './\1.component.css'", new_content)
    new_content = re.sub(r"styleUrls:\s*\[\s*'\./([a-zA-Z0-9_-]+)\.css'\s*\]", r"styleUrls: ['./\1.component.css']", new_content)

    # 3. Update module imports: import('./features/auth/auth-module') -> import('./features/auth/auth.module')
    new_content = re.sub(r"import\('\./([a-zA-Z0-9_/-]+)-module'\)", r"import('./\1.module')", new_content)

    # 4. Update import paths for modules (e.g. from './app-routing-module' -> from './app-routing.module')
    new_content = re.sub(r"from\s+'(\./[a-zA-Z0-9_/-]+)-module'", r"from '\1.module'", new_content)

    # 5. Fix App -> AppComponent in app.module.ts and app.component.ts
    if os.path.basename(filepath) == 'app.module.ts':
        new_content = new_content.replace("import { App } from './app';", "import { AppComponent } from './app.component';")
        new_content = new_content.replace("declarations: [App]", "declarations: [AppComponent]")
        new_content = new_content.replace("bootstrap: [App]", "bootstrap: [AppComponent]")
    elif os.path.basename(filepath) == 'app.component.ts':
        new_content = new_content.replace("export class App {", "export class AppComponent {")
    elif os.path.basename(filepath) == 'app.component.spec.ts':
        new_content = new_content.replace("import { App } from './app';", "import { AppComponent } from './app.component';")
        new_content = new_content.replace("describe('App',", "describe('AppComponent',")

    # 6. Fix shared/layout path to layout
    new_content = new_content.replace("'./shared/layout/layout-module'", "'./layout/layout.module'")
    new_content = new_content.replace("'./shared/layout/layout.module'", "'./layout/layout.module'")

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.ts'):
            update_file(os.path.join(root, file))
