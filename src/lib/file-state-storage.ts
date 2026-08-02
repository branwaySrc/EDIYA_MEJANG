import * as FileSystem from "expo-file-system/legacy";
import type { StateStorage } from "zustand/middleware";

const fallbackMemoryStorage = new Map<string, string>();

export function createFileStateStorage(directoryName: string): StateStorage {
	const storageDirectory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${directoryName}/` : null;

	async function ensureStorageDirectory() {
		if (!storageDirectory) {
			return null;
		}

		await FileSystem.makeDirectoryAsync(storageDirectory, { intermediates: true });

		return storageDirectory;
	}

	function getStorageFileUri(name: string) {
		return storageDirectory ? `${storageDirectory}${encodeURIComponent(name)}.json` : null;
	}

	return {
		getItem: async name => {
			const fileUri = getStorageFileUri(name);

			if (!fileUri) {
				return fallbackMemoryStorage.get(name) ?? null;
			}

			try {
				await ensureStorageDirectory();
				const fileInfo = await FileSystem.getInfoAsync(fileUri);

				if (!fileInfo.exists) {
					return null;
				}

				return await FileSystem.readAsStringAsync(fileUri);
			} catch {
				return fallbackMemoryStorage.get(name) ?? null;
			}
		},
		removeItem: async name => {
			const fileUri = getStorageFileUri(name);

			fallbackMemoryStorage.delete(name);

			if (!fileUri) {
				return;
			}

			await FileSystem.deleteAsync(fileUri, { idempotent: true });
		},
		setItem: async (name, value) => {
			const fileUri = getStorageFileUri(name);

			fallbackMemoryStorage.set(name, value);

			if (!fileUri) {
				return;
			}

			await ensureStorageDirectory();
			await FileSystem.writeAsStringAsync(fileUri, value);
		},
	};
}
