"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const child_process_1 = require("child_process");
class CommandItem extends vscode.TreeItem {
    constructor(label, commandId, icon, context) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.commandId = commandId;
        this.icon = icon;
        this.context = context;
        this.command = {
            command: commandId,
            title: this.label,
        };
        if (icon) {
            this.iconPath = {
                light: path.join(context.extensionPath, 'images', 'light', icon),
                dark: path.join(context.extensionPath, 'images', 'dark', icon)
            };
        }
    }
}
class CommandTreeDataProvider {
    constructor(items) {
        this.items = items;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return Promise.resolve(this.items);
        }
        return Promise.resolve([]);
    }
}
function createCommandPanel(context) {
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
    const commandItems = commands.map((cmd) => new CommandItem(cmd.title, cmd.command, cmd.icon, context));
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
function checkAndInstallDependencies_shell(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('No open workspace. Please open a directory first.');
                return null;
            }
            const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const scriptPath = path.join(context.extensionPath, 'code', 'install_deps.sh');
            // Run the shell script
            (0, child_process_1.exec)(`bash ${scriptPath}`, (error, stdout, stderr) => {
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
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed to add dependencies: ${message}`);
            }
            else {
                vscode.window.showErrorMessage("Failed to add dependencies");
            }
            return false;
        }
        vscode.window.showInformationMessage('Successfully added dependencies');
        return true;
    });
}
function checkAndInstallDependencies(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const pythonInterpreter = vscode.workspace.getConfiguration('python3').get('pythonPath', 'pip3');
        const modules = ['ioxplugin', 'fastjsonschema']; // Example modules
        modules.forEach(module => {
            vscode.window.showInformationMessage(`installing/upgrading ${module} ...`);
            child_process.exec(`${pythonInterpreter} install --upgrade ${module}`, (installError, installStdout, installStderr) => {
                if (installError) {
                    vscode.window.showErrorMessage(`Failed to install/upgrade ${module}: ${installStderr}`);
                }
                else {
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
    });
}
function saveSnippet(workspace_folder, snippet_path, select) {
    /*const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        */
    const destinationPath = path.join(workspace_folder, path.basename(snippet_path));
    console.log(destinationPath);
    console.log(snippet_path);
    fs.copyFileSync(snippet_path, destinationPath);
    vscode.window.showInformationMessage(`Template copied to ${destinationPath}`);
    if (select) {
        vscode.commands.executeCommand('workbench.action.focusSideBar');
        vscode.commands.executeCommand('workbench.view.explorer');
    }
    return true;
    /* }
     return false*/
}
function onClose(context, workspaceFolder, snippet_path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (snippet_path) {
            saveSnippet(workspaceFolder, snippet_path, false);
        }
        const uri = vscode.Uri.file(workspaceFolder);
        yield vscode.commands.executeCommand('vscode.openFolder', uri, false);
    });
}
function createNewIoXPluginProject(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const workspaceFolder = yield vscode.window.showInputBox({
                prompt: 'Enter path for the new IoX Plugin project',
                value: vscode.workspace.workspaceFolders == undefined ? "type path here" : vscode.workspace.workspaceFolders[0].uri.fsPath
            });
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Project creation cancelled.');
                return false;
            }
            const snippet_path = yield createJSON(context, workspaceFolder, false);
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
                }
                else {
                    onClose(context, workspaceFolder, snippet_path);
                }
            });
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed to create project: ${message}`);
            }
            else {
                vscode.window.showErrorMessage("Failed to create project due to an unknown error");
            }
            return false;
        }
        vscode.window.showInformationMessage('Generating IoX Plugin project completed successfully');
        return true;
    });
}
function createJSON(context_1, destPath_1) {
    return __awaiter(this, arguments, void 0, function* (context, destPath, save = true) {
        try {
            const packageJsonPath = path.join(context.extensionPath, 'package.json');
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            const snippetOptions = packageJson.contributes.snippets.map((snippet) => ({
                label: snippet.description,
                detail: snippet.path,
                fullPath: path.join(context.extensionPath, snippet.path)
            }));
            // Show quick pick and use the correct type for the picked result
            const pickedSnippet = yield vscode.window.showQuickPick(snippetOptions, {
                placeHolder: 'Please choose a template ...'
            });
            if (pickedSnippet) {
                if (save) {
                    saveSnippet(destPath, pickedSnippet.fullPath, true);
                }
                return pickedSnippet.fullPath;
            }
            return null;
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed to copy template: ${message}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed to copy template due to an unknown error`);
            }
            return null;
        }
    });
}
function getPluginJSONFile(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileExtension = '.iox_plugin.json';
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('No open workspace. Please open a directory first.');
                return null;
            }
            const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const pattern = new vscode.RelativePattern(workspaceFolder, `**/*${fileExtension}`);
            const files = yield vscode.workspace.findFiles(pattern, null, 1); // Limit search to 100 files
            if (files.length === 0) {
                vscode.window.showErrorMessage("You don't have any IoX Plugin JSON Files. Let's create one!");
                createJSON(context, workspaceFolder, true);
            }
            else {
                const items = files.map(file => ({
                    detail: file.fsPath,
                    uri: file
                }));
                vscode.window.showInformationMessage(`Generating Plugin Code for ${items[0].detail}.`);
                return items[0].uri;
            }
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed to copy template: ${message}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed to copy template due to an unknown error`);
            }
            return null;
        }
        return null;
    });
}
function generatePluginCode(context, fileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let workspaceFolder = vscode.workspace.workspaceFolders == undefined ? "type path here" : vscode.workspace.workspaceFolders[0].uri.fsPath;
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Cannot find project directory');
                return false;
            }
            const scriptPath = path.join(context.extensionPath, 'code', 'plugin.py');
            if (!fileUri) {
                const fu = yield getPluginJSONFile(context);
                fileUri = fu;
            }
            if (!fileUri)
                return false;
            const pythonPath = context.extensionPath;
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
                }
                else {
                    console.log('IoX Plugin Code generation completed successfully');
                    vscode.window.showInformationMessage('IoX Plugin Code generation completed successfully');
                    vscode.commands.executeCommand('workbench.action.focusSideBar');
                    vscode.commands.executeCommand('workbench.view.explorer');
                }
            });
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed to generated IoX Plugin Code: ${message}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed to generated IoX Plugin Code due to an unknown error`);
            }
            return false;
        }
        vscode.window.showInformationMessage('IoX Plugin Code generation completed successfully');
        return true;
    });
}
function addPluginToStore(context, fileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let workspaceFolder = vscode.workspace.workspaceFolders == undefined ? "type path here" : vscode.workspace.workspaceFolders[0].uri.fsPath;
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Cannot find project directory');
                return false;
            }
            let workspaceFolder_uri = null;
            if (vscode.workspace.workspaceFolders)
                workspaceFolder_uri = vscode.workspace.workspaceFolders[0].uri;
            const email = yield vscode.window.showInputBox({
                prompt: 'Please enter your developer account email address',
            });
            if (!email) {
                vscode.window.showErrorMessage('Need your email address for vetting ...');
                return false;
            }
            const devUser = yield vscode.window.showInputBox({
                prompt: 'Please enter your local user (account) on this machine (your development machine)',
            });
            if (!devUser) {
                vscode.window.showErrorMessage('To setup the store entry, we need to know which account is running the plugin during development ...');
                return false;
            }
            const scriptPath = path.join(context.extensionPath, 'code', 'local_store.py');
            if (!fileUri) {
                const fu = yield getPluginJSONFile(context);
                fileUri = fu;
            }
            if (!fileUri)
                return false;
            const pythonPath = context.extensionPath;
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
                }
                else {
                    console.log('Plugin added successfully to the local store');
                    vscode.window.showInformationMessage('Plugin added successfully to the local store');
                    vscode.commands.executeCommand('workbench.action.focusSideBar');
                    vscode.commands.executeCommand('workbench.view.explorer');
                    installOnIoX(context, workspaceFolder_uri);
                }
            });
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed adding Plugin to the local store: ${message}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed adding Plugin to the local store due to unknown error`);
            }
            return false;
        }
        vscode.window.showInformationMessage('Successfully added Plugin to local store');
        return true;
    });
}
function installOnIoX(context, fileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let workspaceFolder = vscode.workspace.workspaceFolders == undefined ? "type path here" : vscode.workspace.workspaceFolders[0].uri.fsPath;
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Cannot find project directory');
                return false;
            }
            const username = yield vscode.window.showInputBox({
                prompt: 'Please enter your local PG3 username here',
            });
            if (!username) {
                vscode.window.showErrorMessage('Need your local PG3 username to login ...');
                return false;
            }
            const password = yield vscode.window.showInputBox({
                prompt: 'Please enter your local PG3 password here',
            });
            if (!password) {
                vscode.window.showErrorMessage('Need your local PG3 password to login ...');
                return false;
            }
            const scriptPath = path.join(context.extensionPath, 'code', 'install_on_iox.py');
            if (!fileUri) {
                const fu = yield getPluginJSONFile(context);
                fileUri = fu;
            }
            if (!fileUri)
                return false;
            const pythonPath = context.extensionPath;
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
                }
                else {
                    console.log('Plugin installed successfully ');
                    vscode.window.showInformationMessage('Plugin insalled successfully ');
                    vscode.commands.executeCommand('workbench.action.focusSideBar');
                    vscode.commands.executeCommand('workbench.view.explorer');
                }
            });
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed installing Plugin : ${message}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed installing Plugin to the local store due to unknown error`);
            }
            return false;
        }
        vscode.window.showInformationMessage('Successfully installing Plugin');
        return true;
    });
}
function activate(context) {
    let python_dep = vscode.commands.registerCommand('iox-plugin-ext.ensureDependencies', () => __awaiter(this, void 0, void 0, function* () {
        checkAndInstallDependencies(context);
    }));
    context.subscriptions.push(python_dep);
    checkAndInstallDependencies(context);
    let createProject = vscode.commands.registerCommand('iox-plugin-ext.createProject', () => __awaiter(this, void 0, void 0, function* () {
        let prc = yield createNewIoXPluginProject(context);
        if (prc.valueOf())
            context.subscriptions.push(createProject);
    }));
    let create_JSON = vscode.commands.registerCommand('iox-plugin-ext.createJSON', (fileUri) => __awaiter(this, void 0, void 0, function* () {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            let prc = yield createJSON(context, workspaceFolders[0].uri.fsPath, true);
            if (prc)
                context.subscriptions.push(create_JSON);
        }
    }));
    let generateCode = vscode.commands.registerCommand('iox-plugin-ext.generatePluginCode', (fileUri) => __awaiter(this, void 0, void 0, function* () {
        let prc = yield generatePluginCode(context, fileUri);
        if (prc.valueOf())
            context.subscriptions.push(generateCode);
    }));
    let addToStore = vscode.commands.registerCommand('iox-plugin-ext.addToStore', (fileUri) => __awaiter(this, void 0, void 0, function* () {
        let prc = yield addPluginToStore(context, fileUri);
        if (prc.valueOf())
            context.subscriptions.push(addToStore);
    }));
    let installPlugin = vscode.commands.registerCommand('iox-plugin-ext.installOnIoX', (fileUri) => __awaiter(this, void 0, void 0, function* () {
        let prc = yield installOnIoX(context, fileUri);
        if (prc.valueOf())
            context.subscriptions.push(addToStore);
    }));
    createCommandPanel(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map