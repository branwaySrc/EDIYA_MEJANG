export type DeliveryCredential = {
	description?: string;
	password: string;
	username: string;
};

export type DeliverySiteId = "baemin" | "coupang-eats" | "yogiyo" | "ediya-order";

export type DeliverySiteData = {
	credential: DeliveryCredential;
	id: DeliverySiteId;
	tabLabel: string;
	title: string;
	uri: string;
};
