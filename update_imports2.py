import os
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content

    # Fix module imports with ../
    new_content = re.sub(r"import\('(\.\./)+features/([a-zA-Z0-9_-]+)/\2-module'\)", r"import('\1features/\2/\2.module')", new_content)
    
    # Fix layout module imports in app-routing.module.ts
    new_content = re.sub(r"import\('\./shared/layout/layout-module'\)", r"import('./layout/layout.module')", new_content)

    # Replace /dashboard' with /dashboard.component'
    new_content = new_content.replace("'./dashboard/dashboard'", "'./dashboard/dashboard.component'")
    
    # Replace '../components/panel-general/panel-general' from layout.module.ts since layout moved to app/layout
    new_content = new_content.replace("'../components/panel-general/panel-general'", "'../shared/components/panel-general/panel-general.component'")

    # Let's fix feature component imports in module files
    # E.g., import { LoginComponent } from './login/login'; -> import { LoginComponent } from './login/login.component';
    # Regex: from './some-dir/some-name' where it doesn't end in .module or .component
    new_content = re.sub(r"from '(\./[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)'", r"from '\1.component'", new_content)
    
    # Clean up double .component.component if any
    new_content = new_content.replace(".component.component'", ".component'")
    
    # Fix import { PanelGeneralComponent } from '../../shared/components/panel-general/panel-general.component'
    # if it's already '../shared/...' we just make sure it's .component

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.ts'):
            update_file(os.path.join(root, file))

