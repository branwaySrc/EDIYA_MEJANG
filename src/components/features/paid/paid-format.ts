export function formatWon(amount: number) {
	return `${amount.toLocaleString("ko-KR")}원`;
}

export function onlyDigits(value: string) {
	return value.replace(/\D/g, "");
}

export function getTodayInputValue() {
	const today = new Date();
	const year = today.getFullYear();
	const month = `${today.getMonth() + 1}`.padStart(2, "0");
	const date = `${today.getDate()}`.padStart(2, "0");

	return `${year}-${month}-${date}`;
}
