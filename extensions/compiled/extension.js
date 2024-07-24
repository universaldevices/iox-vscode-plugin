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
function checkAndInstallPythonModules() {
    return __awaiter(this, void 0, void 0, function* () {
        const pythonInterpreter = vscode.workspace.getConfiguration('python3').get('pythonPath', 'pip3');
        const modules = ['ioxplugin', 'fastjsonschema']; // Example modules
        modules.forEach(module => {
            child_process.exec(`${pythonInterpreter} -c "import ${module}"`, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showInformationMessage(`${module} is not installed. Installing...`);
                    child_process.exec(`${pythonInterpreter} install ${module}`, (installError, installStdout, installStderr) => {
                        if (installError) {
                            vscode.window.showErrorMessage(`Failed to install ${module}: ${installStderr}`);
                        }
                        else {
                            vscode.window.showInformationMessage(`${module} installed successfully.`);
                        }
                    });
                }
            });
        });
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
                    console.log('Generating IoX Plugin project completed successfully');
                    vscode.window.showInformationMessage('Generating IoX Plugin project completed successfully');
                    const uri = vscode.Uri.file(workspaceFolder);
                    vscode.commands.executeCommand('vscode.openFolder', uri, false);
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
function createJSON(context) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    const destinationPath = path.join(workspaceFolders[0].uri.fsPath, path.basename(pickedSnippet.fullPath));
                    fs.copyFileSync(pickedSnippet.fullPath, destinationPath);
                    vscode.window.showInformationMessage(`Template copied to ${destinationPath}`);
                    vscode.commands.executeCommand('workbench.action.focusSideBar');
                    vscode.commands.executeCommand('workbench.view.explorer');
                }
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
            return false;
        }
        return true;
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
                createJSON(context);
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
        vscode.window.showInformationMessage('Successfully added Plugin added to local store');
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
                    console.log(`Installing on IoX exited with code ${code}`);
                    vscode.window.showErrorMessage(`Installing on IoX exited with code ${code}`);
                    return false;
                }
                else {
                    console.log('Plugin successfully installed on IoX');
                    vscode.window.showInformationMessage('Plugin successfully installed on IoX ');
                    vscode.commands.executeCommand('workbench.action.focusSideBar');
                    vscode.commands.executeCommand('workbench.view.explorer');
                }
            });
        }
        catch (error) {
            if (typeof error === "object" && error !== null && "message" in error) {
                const message = error.message;
                vscode.window.showErrorMessage(`Failed installing Plugin on IoX: ${message}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed installing Plugin on IoX due to unknown error`);
            }
            return false;
        }
        vscode.window.showInformationMessage('Successfully installed Plugin on IoX');
        return true;
    });
}
function activate(context) {
    let python_dep = vscode.commands.registerCommand('iox-plugin-ext.ensurePythonDependencies', () => __awaiter(this, void 0, void 0, function* () {
        checkAndInstallPythonModules();
    }));
    context.subscriptions.push(python_dep);
    checkAndInstallPythonModules();
    let createProject = vscode.commands.registerCommand('iox-plugin-ext.createProject', () => __awaiter(this, void 0, void 0, function* () {
        let prc = yield createNewIoXPluginProject(context);
        if (prc.valueOf())
            context.subscriptions.push(createProject);
    }));
    let create_JSON = vscode.commands.registerCommand('iox-plugin-ext.createJSON', (fileUri) => __awaiter(this, void 0, void 0, function* () {
        let prc = yield createJSON(context);
        if (prc.valueOf())
            context.subscriptions.push(create_JSON);
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
    createCommandPanel(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map