import * as FileSystem from "expo-file-system/legacy";

const contentImageDirectory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}content-images/` : null;

function getExtension(fileName?: string | null, uri?: string) {
	const source = fileName ?? uri ?? "";
	const match = source.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);

	return match?.[1]?.toLowerCase() ?? "jpg";
}

export async function preserveContentImage(uri: string, fileName?: string | null) {
	if (!contentImageDirectory || uri.startsWith(contentImageDirectory)) {
		return uri;
	}

	try {
		await FileSystem.makeDirectoryAsync(contentImageDirectory, { intermediates: true });
		const extension = getExtension(fileName, uri);
		const destination = `${contentImageDirectory}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

		await FileSystem.copyAsync({ from: uri, to: destination });

		return destination;
	} catch {
		return uri;
	}
}
