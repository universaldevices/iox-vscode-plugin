import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { exec } from 'child_process';


class CommandItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly commandId: string,
        public readonly icon: string, 
        public readonly context: vscode.ExtensionContext
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = {
            command: commandId,
            title: this.label,
        };
        if (icon)
        {
            this.iconPath = {
                light: path.join(context.extensionPath, 'images', 'light', icon),
                dark: path.join(context.extensionPath, 'images', 'dark', icon)
            }
        }
    }
}

class CommandTreeDataProvider implements vscode.TreeDataProvider<CommandItem> {
    constructor(private items: CommandItem[]) {}

    getTreeItem(element: CommandItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CommandItem): Thenable<CommandItem[]> {
        if (element === undefined) {
            return Promise.resolve(this.items);
        }
        return Promise.resolve([]);
    }
}

function createCommandPanel(context: vscode.ExtensionContext){
    const extension = vscode.extensions.getExtension('UniversalDevices.iox-plugin-ext');
    if (!extension) {
        console.error('Extension not found.');
        return;
    }

    const commands = extension.packageJSON.contributes.commands;
    if (!commands) {
        console.error('Commands not found in packageJSON.');
        return;
    }
    const commandItems = commands.map((cmd: any) => new CommandItem(cmd.title, cmd.command, cmd.icon, context));


    const treeDataProvider = new CommandTreeDataProvider(commandItems);
    vscode.window.createTreeView('ioxPluginSidebar', { treeDataProvider });

   /* context.subscriptions.push(
        vscode.commands.registerCommand('myExtension.command1', () => {
            vscode.window.showInformationMessage('Command 1 executed!');
        }),
        vscode.commands.registerCommand('myExtension.command2', () => {
            vscode.window.showInformationMessage('Command 2 executed!');
        })
    );*/
}

async function checkAndInstallDependencies_shell(context:vscode.ExtensionContext) {
    try {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No open workspace. Please open a directory first.');
            return null ;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

        const scriptPath = path.join(context.extensionPath, 'code', 'install_deps.sh');

         // Run the shell script
        exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                vscode.window.showErrorMessage(`Error: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Output: ${stdout}`);
        });

    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed to add dependencies: ${message}`);
        } else {
            vscode.window.showErrorMessage("Failed to add dependencies");
        }
        return false;
    }
    vscode.window.showInformationMessage('Successfully added dependencies');
    return true;

}

async function checkAndInstallDependencies(context:vscode.ExtensionContext) {
  const pythonInterpreter = vscode.workspace.getConfiguration('python3').get<string>('pythonPath', 'pip3');

  const modules = ['ioxplugin','fastjsonschema'];  // Example modules
  modules.forEach(module => {
    vscode.window.showInformationMessage(`installing/upgrading ${module} ...`);
    child_process.exec(`${pythonInterpreter} install --upgrade ${module}`, (installError, installStdout, installStderr) => {
        if (installError) {
            vscode.window.showErrorMessage(`Failed to install/upgrade ${module}: ${installStderr}`);
        } else {
            vscode.window.showInformationMessage(`${module} installed/upgraded successfully.`);
        }
    });

/*    
      child_process.exec(`${pythonInterpreter} -c "import ${module}"`, (error, stdout, stderr) => {
          if (error) {
              vscode.window.showInformationMessage(`${module} is not installed. Installing...`);
              child_process.exec(`${pythonInterpreter} install ${module}`, (installError, installStdout, installStderr) => {
                  if (installError) {
                      vscode.window.showErrorMessage(`Failed to install ${module}: ${installStderr}`);
                  } else {
                      vscode.window.showInformationMessage(`${module} installed successfully.`);
                  }
              });
          }else{
              vscode.window.showInformationMessage(`${module} is installed. Upgrading ...`);
              child_process.exec(`${pythonInterpreter} install --upgrade ${module}`, (installError, installStdout, installStderr) => {
                  if (installError) {
                      vscode.window.showErrorMessage(`Failed to upgrade ${module}: ${installStderr}`);
                  } else {
                      vscode.window.showInformationMessage(`${module} upgraded successfully.`);
                  }
              });

          }
      });*/
  });
}

function saveSnippet(workspace_folder:string, snippet_path: string, select:boolean)
{
    /*const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        */
        const destinationPath = path.join(workspace_folder, path.basename(snippet_path));
        console.log(destinationPath);
        console.log(snippet_path);
        fs.copyFileSync(snippet_path, destinationPath);
        vscode.window.showInformationMessage(`Template copied to ${destinationPath}`);
        if (select)
        {
            vscode.commands.executeCommand('workbench.action.focusSideBar');
            vscode.commands.executeCommand('workbench.view.explorer');
        }
        return true;
   /* }
    return false*/
}

async function onClose(context: vscode.ExtensionContext, workspaceFolder: string, snippet_path:string|null) 
{
    if (snippet_path)
    {
        saveSnippet(workspaceFolder, snippet_path, false)
    }
    const uri = vscode.Uri.file(workspaceFolder);
    await vscode.commands.executeCommand('vscode.openFolder', uri, false);
}

async function createNewIoXPluginProject(context: vscode.ExtensionContext) 
{
    try {
        const workspaceFolder = await vscode.window.showInputBox({
            prompt: 'Enter path for the new IoX Plugin project',
            value: vscode.workspace.workspaceFolders == undefined? "type path here": vscode.workspace.workspaceFolders[0].uri.fsPath
        });

        if (!workspaceFolder) {
          vscode.window.showErrorMessage('Project creation cancelled.');
          return false;
        }

        const snippet_path =await createJSON(context, workspaceFolder, false);
       
        const scriptPath = path.join(context.extensionPath, 'code', 'new_project.py');

        const pythonProcess = child_process.spawn('python3', [scriptPath, workspaceFolder, context.extensionPath]);

        pythonProcess.stdout.on('data', (data) => {
              console.log(`${data}`);
              vscode.window.showInformationMessage(`${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
              console.error(`${data}`);
              vscode.window.showErrorMessage(`${data}`);
        });

        pythonProcess.on('close', (code) => {
              if (code !== 0) {
                  console.log(`${code}`);
                  vscode.window.showErrorMessage(`${code}`);
                  return false;
              } else {
                  onClose(context, workspaceFolder, snippet_path)
              }
        });

    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed to create project: ${message}`);
        } else {
            vscode.window.showErrorMessage("Failed to create project due to an unknown error");
        }
        return false;
    }
    vscode.window.showInformationMessage('Generating IoX Plugin project completed successfully');
    return true;
}


async function createJSON(context: vscode.ExtensionContext, destPath:string, save:boolean=true) 
{
    try {
        const packageJsonPath = path.join(context.extensionPath, 'package.json');
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        
        interface SnippetOption {
            label: string;
            detail: string;
            fullPath: string;
        }
        
        const snippetOptions: SnippetOption[] = packageJson.contributes.snippets.map((snippet: { description: string; path: string }) => ({
            label: snippet.description,
            detail: snippet.path,
            fullPath: path.join(context.extensionPath, snippet.path)
        }));
        // Show quick pick and use the correct type for the picked result
         const pickedSnippet = await vscode.window.showQuickPick(snippetOptions, {
            placeHolder: 'Please choose a template ...'
        });

        if (pickedSnippet) {
            if (save)
            {
                saveSnippet(destPath, pickedSnippet.fullPath, true);
            }
            return pickedSnippet.fullPath;
        }
        return null;
    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed to copy template: ${message}`);
        } else {
            vscode.window.showErrorMessage(`Failed to copy template due to an unknown error`);
        }
        return null ;
    }
}

async function getPluginJSONFile(context: vscode.ExtensionContext):Promise<vscode.Uri | null>
{
    try {
        const fileExtension = '.iox_plugin.json'; 
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No open workspace. Please open a directory first.');
            return null ;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const pattern = new vscode.RelativePattern(workspaceFolder, `**/*${fileExtension}`);
        const files = await vscode.workspace.findFiles(pattern, null, 1); // Limit search to 100 files

        if (files.length === 0) {
            vscode.window.showErrorMessage("You don't have any IoX Plugin JSON Files. Let's create one!");
            createJSON(context, workspaceFolder, true)
        } else {
            const items = files.map(file => ({
                detail: file.fsPath,
                uri: file
            }));

            vscode.window.showInformationMessage(`Generating Plugin Code for ${items[0].detail}.`);
            return items[0].uri;
        }
    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed to copy template: ${message}`);
        } else {
            vscode.window.showErrorMessage(`Failed to copy template due to an unknown error`);
        }
        return null;
    }
    return null;
}

async function generatePluginCode(context: vscode.ExtensionContext, fileUri: vscode.Uri|null) 
{
    try {
        let workspaceFolder = vscode.workspace.workspaceFolders == undefined? "type path here": vscode.workspace.workspaceFolders[0].uri.fsPath;

        if (!workspaceFolder) {
          vscode.window.showErrorMessage('Cannot find project directory');
          return false;
        }

        const scriptPath = path.join(context.extensionPath, 'code', 'plugin.py');

        if (! fileUri)
        {
             const fu = await getPluginJSONFile(context);
             fileUri = fu
        }

        if (! fileUri)
            return false;

        const pythonPath = context.extensionPath 

    /*    child_process.execFile(pythonPath, ["-c", "import sys; print(sys.version)"], (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error: ${stderr}`);
                    return;
                }
                vscode.window.showInformationMessage(`Python Version: ${stdout}`);
        });*/

        const pythonProcess = child_process.spawn('python3', [scriptPath, workspaceFolder, fileUri.fsPath]);

        pythonProcess.stdout.on('data', (data) => {
              console.log(`${data}`);
              vscode.window.showInformationMessage(`${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
              console.error(`${data}`);
              vscode.window.showErrorMessage(`${data}`);
        });

        pythonProcess.on('close', (code) => {
              if (code !== 0) {
                  console.log(`IoX Plugin Code generation exited with code ${code}`);
                  vscode.window.showErrorMessage(`IoX Plugin Code generation exited with code ${code}`);
                  return false;
              } else {
                  console.log('IoX Plugin Code generation completed successfully');
                  vscode.window.showInformationMessage('IoX Plugin Code generation completed successfully');
                  vscode.commands.executeCommand('workbench.action.focusSideBar');
                  vscode.commands.executeCommand('workbench.view.explorer');
              }
        });

    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed to generated IoX Plugin Code: ${message}`);
        } else {
            vscode.window.showErrorMessage(`Failed to generated IoX Plugin Code due to an unknown error`);
        }
        return false;
    }
    vscode.window.showInformationMessage('IoX Plugin Code generation completed successfully');
    return true;
}

async function addPluginToStore(context: vscode.ExtensionContext, fileUri: vscode.Uri|null) 
{
    try {
        let workspaceFolder = vscode.workspace.workspaceFolders == undefined? "type path here": vscode.workspace.workspaceFolders[0].uri.fsPath;

        if (!workspaceFolder) {
          vscode.window.showErrorMessage('Cannot find project directory');
          return false;
        }

        let workspaceFolder_uri = null;
        if (vscode.workspace.workspaceFolders)
            workspaceFolder_uri = vscode.workspace.workspaceFolders[0].uri;

        const email = await vscode.window.showInputBox({
            prompt: 'Please enter your developer account email address',
        });

        if (!email) {
          vscode.window.showErrorMessage('Need your email address for vetting ...');
          return false;
        }

        const devUser = await vscode.window.showInputBox({
            prompt: 'Please enter your local user (account) on this machine (your development machine)',
        });

        if (!devUser) {
          vscode.window.showErrorMessage('To setup the store entry, we need to know which account is running the plugin during development ...')
          return false;
        }


        const scriptPath = path.join(context.extensionPath, 'code', 'local_store.py');

        if (! fileUri)
        {
             const fu = await getPluginJSONFile(context);
             fileUri = fu
        }

        if (! fileUri)
            return false;

        const pythonPath = context.extensionPath 

    /*    child_process.execFile(pythonPath, ["-c", "import sys; print(sys.version)"], (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error: ${stderr}`);
                    return;
                }
                vscode.window.showInformationMessage(`Python Version: ${stdout}`);
        });*/

        const pythonProcess = child_process.spawn('python3', [scriptPath, workspaceFolder, fileUri.fsPath, email, devUser]);

        pythonProcess.stdout.on('data', (data) => {
              console.log(`${data}`);
              vscode.window.showInformationMessage(`${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
              console.error(`${data}`);
              vscode.window.showErrorMessage(`${data}`);
        });

        pythonProcess.on('close', (code) => {
              if (code !== 0) {
                  console.log(`Adding Plugin local store entry exited with code ${code}`);
                  vscode.window.showErrorMessage(`Adding Plugin local store entry exited with code ${code}`);
                  return false;
              } else {
                  console.log('Plugin added successfully to the local store');
                  vscode.window.showInformationMessage('Plugin added successfully to the local store');
                  vscode.commands.executeCommand('workbench.action.focusSideBar');
                  vscode.commands.executeCommand('workbench.view.explorer');
                  installOnIoX(context, workspaceFolder_uri )
              }
        });

    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed adding Plugin to the local store: ${message}`);
        } else {
            vscode.window.showErrorMessage(`Failed adding Plugin to the local store due to unknown error`);
        }
        return false;
    }
    vscode.window.showInformationMessage('Successfully added Plugin to local store');
    return true;
}

async function installOnIoX(context: vscode.ExtensionContext, fileUri: vscode.Uri|null) 
{
    try {
        let workspaceFolder = vscode.workspace.workspaceFolders == undefined? "type path here": vscode.workspace.workspaceFolders[0].uri.fsPath;

        if (!workspaceFolder) {
          vscode.window.showErrorMessage('Cannot find project directory');
          return false;
        }

        const username = await vscode.window.showInputBox({
            prompt: 'Please enter your local PG3 username here',
        });

        if (!username) {
          vscode.window.showErrorMessage('Need your local PG3 username to login ...');
          return false;
        }

        const password = await vscode.window.showInputBox({
            prompt: 'Please enter your local PG3 password here', 
        });

        if (!password) {
          vscode.window.showErrorMessage('Need your local PG3 password to login ...');
          return false;
        }


        const scriptPath = path.join(context.extensionPath, 'code', 'install_on_iox.py');

        if (! fileUri)
        {
             const fu = await getPluginJSONFile(context);
             fileUri = fu
        }

        if (! fileUri)
            return false;

        const pythonPath = context.extensionPath 

    /*    child_process.execFile(pythonPath, ["-c", "import sys; print(sys.version)"], (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error: ${stderr}`);
                    return;
                }
                vscode.window.showInformationMessage(`Python Version: ${stdout}`);
        });*/

        const pythonProcess = child_process.spawn('python3', [scriptPath, workspaceFolder, username, password]);

        pythonProcess.stdout.on('data', (data) => {
              console.log(`${data}`);
              vscode.window.showInformationMessage(`${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
              console.error(`${data}`);
              vscode.window.showErrorMessage(`${data}`);
        });

        pythonProcess.on('close', (code) => {
              if (code !== 0) {
                  console.log(`Installing Plugin exited with code ${code}`);
                  vscode.window.showErrorMessage(`Installing Plugin exited with code ${code}`);
                  return false;
              } else {
                  console.log('Plugin installed successfully ');
                  vscode.window.showInformationMessage('Plugin insalled successfully ');
                  vscode.commands.executeCommand('workbench.action.focusSideBar');
                  vscode.commands.executeCommand('workbench.view.explorer');
              }
        });

    } catch (error: unknown) {
        if (typeof error === "object" && error !== null && "message" in error) {
            const message = (error as { message: string }).message;
            vscode.window.showErrorMessage(`Failed installing Plugin : ${message}`);
        } else {
            vscode.window.showErrorMessage(`Failed installing Plugin to the local store due to unknown error`);
        }
        return false;
    }
    return true;
}



export function activate(context: vscode.ExtensionContext) {

  let python_dep = vscode.commands.registerCommand('iox-plugin-ext.ensureDependencies', async () => {
   checkAndInstallDependencies(context);
  });
  context.subscriptions.push(python_dep);
  checkAndInstallDependencies(context);

  let createProject = vscode.commands.registerCommand('iox-plugin-ext.createProject', async () => {
    let prc = await createNewIoXPluginProject(context);
    if (prc.valueOf())
        context.subscriptions.push(createProject);
  });

  let create_JSON = vscode.commands.registerCommand('iox-plugin-ext.createJSON', async (fileUri: vscode.Uri)  => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders)
    {
        let prc = await createJSON(context, workspaceFolders[0].uri.fsPath  ,true);
        if (prc)
        context.subscriptions.push(create_JSON);
    }
  });

  let generateCode = vscode.commands.registerCommand('iox-plugin-ext.generatePluginCode', async (fileUri: vscode.Uri)  => {
    let prc = await generatePluginCode(context, fileUri);
    if (prc.valueOf())
        context.subscriptions.push(generateCode);
  });

  let addToStore = vscode.commands.registerCommand('iox-plugin-ext.addToStore', async (fileUri: vscode.Uri)  => {
    let prc = await addPluginToStore(context, fileUri);
    if (prc.valueOf())
        context.subscriptions.push(addToStore);
  });

  let installPlugin = vscode.commands.registerCommand('iox-plugin-ext.installOnIoX', async (fileUri: vscode.Uri)  => {
    let prc = await installOnIoX(context, fileUri);
    if (prc.valueOf())
        context.subscriptions.push(addToStore);
  });

  createCommandPanel(context);

}

export function deactivate() {}
