import * as vscode from 'vscode';
import sample from './sample.json'
import weapons from './weapons.json'

type SelectionArray = Array<string|number>;

interface FileData {
	file: string;
	path: string;
}

interface Keyword {
  default: string;
  doc: string;
	flags: string;
	selection?: SelectionArray | FileData;
};

const debugLog = vscode.window.createOutputChannel("CFG config extension");
debugLog.show();

const keywords: Record<string, Keyword> = sample;

const files: Record<string, any> = { weapons };

export function activate(context: vscode.ExtensionContext) {
	const completionItemProvider = vscode.languages.registerCompletionItemProvider('cfg', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			const completionItems: Array<vscode.CompletionItem> = [];

			for (const keyword in keywords) {
				const completionItem = new vscode.CompletionItem(keyword);

				if (keywords[keyword].selection && isSelectionArray(keywords[keyword].selection))
					completionItem.insertText = new vscode.SnippetString(keyword + ' ${1|' + (keywords[keyword].selection as SelectionArray).join(",") + '|}');
				else if (keywords[keyword].selection && isFileData(keywords[keyword].selection))
					completionItem.insertText = new vscode.SnippetString(keyword + ' ${1|' + stringFromFileData(keywords[keyword].selection as FileData) + '|}');

				completionItem.documentation = new vscode.MarkdownString(keywords[keyword].doc);
				completionItems.push(completionItem);
			}

			return completionItems;
		}
	});

	const hoverProvider = vscode.languages.registerHoverProvider('cfg', {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			const wordRange = document.getWordRangeAtPosition(position);
			const word: string = document.getText(wordRange);

			const comand = keywords[word];

			const markdown = new vscode.MarkdownString(`
				### 🕹️ ${word}
				*${comand.doc}*

				---
				<br>
				<br>

				|Default|Flags|
				|-|-|
				|${comand.default}|${comand.flags}|
			`);

			return new vscode.Hover(markdown);
		}
	});

	context.subscriptions.push(completionItemProvider, hoverProvider);
}

function isFileData(value: SelectionArray | FileData | undefined) {
  return (value as FileData).file !== undefined;
}

function isSelectionArray(value: SelectionArray | FileData | undefined) {
  return Array.isArray(value as SelectionArray)
}

function stringFromFileData(fileData: FileData): string {
	let data = files[fileData.file];
	fileData.path
		.split('.')
		.forEach(key => data = data[key])
	return data.join(", ");
}