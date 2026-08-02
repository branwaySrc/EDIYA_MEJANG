export type HiringWorkplaceId = "dongansan-hospital" | "wolpi";

export type HiringWorkplace = {
	address: string;
	id: HiringWorkplaceId;
	name: string;
	phone: string;
};

export const hiringWorkplaces: HiringWorkplace[] = [
	{
		id: "wolpi",
		name: "이디야 월피동점",
		address: "경기도 안산시 상록구 월피동, 광덕산2로 17 1층",
		phone: "070-4171-7412",
	},
	{
		id: "dongansan-hospital",
		name: "이디야 동안산병원점",
		address: "경기 안산시 상록구 월피로 81, 1층 (월피동)",
		phone: "031-402-3626",
	},
];

export function getHiringWorkplace(id: HiringWorkplaceId | null) {
	return hiringWorkplaces.find(workplace => workplace.id === id) ?? null;
}
