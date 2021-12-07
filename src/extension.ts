import * as vscode from "vscode";
let createFileEvent: vscode.Disposable;
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand("authoring-helper.insertHeader", () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let header = constructHeader(editor.document.languageId);
		editor.edit((editBuilder) => {
			editBuilder.insert(new vscode.Position(0, 0), header);
		});
	});

	if (vscode.workspace.getConfiguration("authoring-helper.enable").get("insertOnCreation")) {
		createFileEvent = vscode.workspace.onDidCreateFiles((e) => insertHeader(e));
	}

	vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
	context.subscriptions.push(disposable);
}

export function onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
	if (e.affectsConfiguration("authoring-helper.enable.insertOnCreation")) {
		if (vscode.workspace.getConfiguration("authoring-helper.enable").get("insertOnCreation")) {
			createFileEvent = vscode.workspace.onDidCreateFiles((e) => insertHeader(e));
		} else {
			createFileEvent.dispose();
		}
	}
}

export function insertHeader(e: vscode.FileCreateEvent) {
	vscode.workspace.openTextDocument(e.files[0]).then((document) => {
		let header = constructHeader(document.languageId);
		const editor = vscode.window.activeTextEditor!;
		editor.edit((editBuilder) => {
			editBuilder.insert(new vscode.Position(0, 0), header);
		});
	});
}

export function constructHeader(languageId: string) {
	let commentorStart = "";
	let commentorEnd = "";
	switch (languageId) {
		case "html":
			commentorStart = "<!--";
			commentorEnd = "-->";
			break;
		case "python":
			commentorStart = '"""';
			commentorEnd = '"""';
			break;
		case "perl":
			commentorStart = "=being";
			commentorEnd = "=end";
		default:
			commentorStart = "/*";
			commentorEnd = "*/";
			break;
	}

	let information = vscode.workspace.getConfiguration("authoring-helper.information");
	let enabled = vscode.workspace.getConfiguration("authoring-helper.enable");
	let date = new Date();

	let dateFormat: string = information.get("dateFormat")
		? information.get("dateFormat")!
		: "yyyy-MM-dd HH:mm:ss";

	let dateToString = dateFormat
		.replace("yyyy", `${date.getFullYear()}`)
		.replace("MM", `${date.getMonth() + 1}`)
		.replace("dd", `${date.getDate()}`)
		.replace("HH", `${date.getHours()}`)
		.replace("mm", `${date.getMinutes()}`)
		.replace("ss", `${date.getSeconds()}`);

	let header = commentorStart + "\n";
	if (enabled.get("author")) {
		header += `\n Author: ${information.get("author")}`;
	}
	if (enabled.get("email")) {
		header += `\n Email: ${information.get("email")}`;
	}
	if (enabled.get("creationDate")) {
		header += `\n\n Creation Date: ${dateToString}`;
	}
	header += `\n\n${commentorEnd}`;

	return header;
}

export function deactivate() {}
