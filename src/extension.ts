import * as vscode from "vscode";
let createFileEvent: vscode.Disposable;
let updateModificationEvent: vscode.Disposable;
let contextState: vscode.ExtensionContext;
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
	if (vscode.workspace.getConfiguration("authoring-helper.enable").get("modificationDate")) {
		updateModificationEvent = vscode.workspace.onWillSaveTextDocument((e) => updateModification(e));
	}

	vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
	contextState = context;
	context.subscriptions.push(disposable);
}

export function updateModification(e: vscode.TextDocumentWillSaveEvent) {
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	let text = editor.document.getText();
	let lines = text.split("\r");
	let index = lines.findIndex((line) => line.includes("Last Modification Date:"));
	if (index === -1) {
		return;
	}
	editor.edit((editBuilder) => {
		editBuilder.replace(
			new vscode.Range(
				new vscode.Position(index, 0),
				new vscode.Position(index, lines[index].length)
			),
			` Last Modification Date: ${formatDate()}`
		);
	});
}

export function onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
	if (e.affectsConfiguration("authoring-helper.enable.insertOnCreation")) {
		if (vscode.workspace.getConfiguration("authoring-helper.enable").get("insertOnCreation")) {
			createFileEvent = vscode.workspace.onDidCreateFiles((e) => insertHeader(e));
		} else {
			createFileEvent.dispose();
		}
	}
	if (e.affectsConfiguration("authoring-helper.enable.modificationDate")) {
		if (vscode.workspace.getConfiguration("authoring-helper.enable").get("modificationDate")) {
			updateModificationEvent = vscode.workspace.onWillSaveTextDocument((e) =>
				updateModification(e)
			);
		} else {
			updateModificationEvent.dispose();
		}
	}
}

export function formatDate() {
	let information = vscode.workspace.getConfiguration("authoring-helper.information");
	let dateFormat: string = information.get("dateFormat")
		? information.get("dateFormat")!
		: "yyyy-MM-dd HH:mm:ss";

	let date = new Date();
	let dateToString = dateFormat
		.replace("yyyy", `${date.getFullYear()}`)
		.replace("MM", `${addZ(date.getMonth() + 1)}`)
		.replace("dd", `${addZ(date.getDate())}`)
		.replace("HH", `${addZ(date.getHours())}`)
		.replace("mm", `${addZ(date.getMinutes())}`)
		.replace("ss", `${addZ(date.getSeconds())}`);

	return dateToString;
}

export function addZ(n: number) {
	return n < 10 ? "0" + n : "" + n;
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
	let customHeader: string = information.get("customHeader")!;
	if (customHeader.length > 0) {
		customHeader = customHeader.replace("{author}", `${information.get("author")}`);
		customHeader = customHeader.replace("{email}", `${information.get("email")}`);
		customHeader = customHeader.replace("{description}", `${information.get("description")}`);
		customHeader = customHeader.replace("{creation}", `${formatDate()}`);
		customHeader = customHeader.replace(
			"{modification}",
			`Last Modification Date: ${formatDate()}`
		);
		return commentorStart + customHeader.replace(/\\n/g, "\n") + commentorEnd;
	}
	let enabled = vscode.workspace.getConfiguration("authoring-helper.enable");

	let header = commentorStart + "\n";
	if (enabled.get("author")) {
		header += `\n Author: ${information.get("author")}`;
	}
	if (enabled.get("email")) {
		header += `\n Email: ${information.get("email")}`;
	}
	if (enabled.get("creationDate")) {
		header += `\n\n Creation Date: ${formatDate()}`;
	}
	if (enabled.get("modificationDate")) {
		header += `\n Last Modification Date: ${formatDate()}`;
	}
	if (enabled.get("description")) {
		header += `\n\n ${information.get("description")}`;
	}

	header += `\n\n${commentorEnd}`;
	return header;
}

export function deactivate() {}
