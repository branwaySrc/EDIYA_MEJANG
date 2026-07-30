import type { HiringContractPage, HiringDraft } from "@/components/features/sajang/hiring/hiring-types";

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function formatWonText(value: string) {
	const digits = value.replace(/\D/g, "");

	if (!digits) {
		return "미입력";
	}

	return `${Number(digits).toLocaleString("ko-KR")}원`;
}

function valueOrDash(value: string) {
	return escapeHtml(value.trim() || "미입력");
}

function contractStyles() {
	return `
		<style>
			* { box-sizing: border-box; }
			body {
				margin: 0;
				padding: 28px;
				color: #111827;
				font-family: -apple-system, BlinkMacSystemFont, "Inter", "Noto Sans KR", sans-serif;
				line-height: 1.58;
			}
			h1 { margin: 0 0 18px; color: #004B93; font-size: 25px; }
			h2 { margin: 26px 0 10px; color: #004B93; font-size: 18px; }
			p { margin: 8px 0; font-size: 14px; }
			table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
			th, td { border: 1px solid #CBD5E1; padding: 9px 10px; font-size: 13px; text-align: left; vertical-align: top; }
			th { width: 132px; background: #F1F5F9; color: #475569; }
			.notice { padding: 12px; background: #F8FAFC; border: 1px solid #CBD5E1; }
			.signature { width: 220px; height: 92px; object-fit: contain; border: 1px solid #CBD5E1; }
			.sign-row { display: flex; gap: 18px; margin-top: 24px; }
			.sign-box { flex: 1; min-height: 140px; border: 1px solid #CBD5E1; padding: 12px; }
			.page-break { page-break-before: always; }
		</style>
	`;
}

function pageShell(title: string, body: string) {
	return `
		<!doctype html>
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				${contractStyles()}
			</head>
			<body>
				<h1>${title}</h1>
				${body}
			</body>
		</html>
	`;
}

function extractBodyHtml(html: string) {
	const match = html.match(/<body>([\s\S]*)<\/body>/);

	return match?.[1] ?? html;
}

function baseInfoTable(draft: HiringDraft) {
	return `
		<table>
			<tr><th>매장명</th><td>${valueOrDash(draft.storeName)}</td></tr>
			<tr><th>매장 주소</th><td>${valueOrDash(draft.storeAddress)}</td></tr>
			<tr><th>매장 전화번호</th><td>${valueOrDash(draft.storePhone)}</td></tr>
			<tr><th>사장</th><td>${valueOrDash(draft.ownerName)}</td></tr>
			<tr><th>직원 이름</th><td>${valueOrDash(draft.employeeName)}</td></tr>
			<tr><th>나이</th><td>${valueOrDash(draft.age)}</td></tr>
			<tr><th>생년월일</th><td>${valueOrDash(draft.birthDate)}</td></tr>
			<tr><th>연락처</th><td>${valueOrDash(draft.phone)}</td></tr>
			<tr><th>이메일</th><td>${valueOrDash(draft.employeeEmail)}</td></tr>
			<tr><th>주소</th><td>${valueOrDash(draft.address)}</td></tr>
		</table>
	`;
}

function workInfoTable(draft: HiringDraft) {
	return `
		<table>
			<tr><th>입사 예정일</th><td>${valueOrDash(draft.startDate)}</td></tr>
			<tr><th>근무요일</th><td>${escapeHtml(draft.workDays.join(", ") || "미입력")}</td></tr>
			<tr><th>근무시간</th><td>${valueOrDash(draft.workTime)}</td></tr>
			<tr><th>시급/급여</th><td>${escapeHtml(formatWonText(draft.hourlyWage))}</td></tr>
			<tr><th>근무조건</th><td>${valueOrDash(draft.workCondition)}</td></tr>
		</table>
	`;
}

export function createHiringContractPages(draft: HiringDraft): HiringContractPage[] {
	return [
		{
			id: "basic",
			title: "근로계약서 - 기본 정보",
			html: pageShell(
				"근로계약서",
				`
					<p>본 계약서는 ${valueOrDash(draft.storeName)}과 근로자 ${valueOrDash(draft.employeeName)} 사이의 근로 조건을 확인하기 위해 작성합니다.</p>
					${baseInfoTable(draft)}
				`,
			),
		},
		{
			id: "work",
			title: "근로계약서 - 근무 조건",
			html: pageShell(
				"근무 조건",
				`
					<p>근로자는 아래 조건에 따라 매장 업무를 수행합니다.</p>
					${workInfoTable(draft)}
				`,
			),
		},
		{
			id: "notice",
			title: "근로계약서 - 유의 사항",
			html: pageShell(
				"유의 사항",
				`
					<div class="notice">
						<p>${valueOrDash(draft.notice)}</p>
						<p>근로자는 매장 위생, 고객 응대, 현금 및 재고 관리 기준을 준수합니다.</p>
						<p>계약 내용은 사장과 근로자가 함께 확인한 뒤 전자 서명으로 보관합니다.</p>
					</div>
				`,
			),
		},
	];
}

export function createHiringContractHtml(draft: HiringDraft, signatureImageDataUrl: string, signedAt: string) {
	const pages = createHiringContractPages(draft)
		.map((page, index) => {
			const body = extractBodyHtml(page.html);

			return `<section class="${index > 0 ? "page-break" : ""}">${body}</section>`;
		})
		.join("");

	return `
		<!doctype html>
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				${contractStyles()}
			</head>
			<body>
				${pages}
				<section class="page-break">
					<h1>전자 서명</h1>
					<p>아래 서명은 ${escapeHtml(signedAt)}에 태블릿 화면에서 직접 작성되었습니다.</p>
					<div class="sign-row">
						<div class="sign-box">
							<p><strong>사장</strong></p>
							<p>${valueOrDash(draft.ownerName)}</p>
						</div>
						<div class="sign-box">
							<p><strong>근로자</strong></p>
							<p>${valueOrDash(draft.employeeName)}</p>
							<img class="signature" src="${signatureImageDataUrl}" />
						</div>
					</div>
				</section>
			</body>
		</html>
	`;
}

export function createHiringSummary(draft: HiringDraft) {
	return [
		{ label: "직원 이름", value: draft.employeeName || "미입력" },
		{ label: "근무요일", value: draft.workDays.join(", ") || "미입력" },
		{ label: "근무시간", value: draft.workTime || "미입력" },
		{ label: "근무조건", value: draft.workCondition || "미입력" },
		{ label: "시급/급여", value: formatWonText(draft.hourlyWage) },
		{ label: "입사 예정일", value: draft.startDate || "미입력" },
		{ label: "유의사항", value: draft.notice || "미입력" },
	];
}
