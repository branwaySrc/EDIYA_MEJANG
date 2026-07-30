export type AdminWebViewNavigationState = {
	canGoBack: boolean;
	canGoForward: boolean;
};

export type AdminWebViewRef = {
	goBack: () => void;
	goForward: () => void;
	reload: () => void;
};

export type AdminWebViewProps = {
	onNavigationStateChange?: (state: AdminWebViewNavigationState) => void;
	title: string;
	uri: string;
};
