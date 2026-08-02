import {
	hiringDocumentKeys,
	hiringDocumentLabels,
	hiringOwnerName,
	type HiringContractPage,
	type HiringDraft,
	type HiringSignatureImages,
} from "@/components/features/sajang/hiring/hiring-types";
import { formatClockMinutes } from "@/database/employee/employee";
import { getKoreaTodayKey } from "@/lib/korea-date";

type PartialHiringSignatureImages = Partial<HiringSignatureImages>;

function escapeHtml(value: string) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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

function formatWorkDays(draft: HiringDraft) {
	return draft.workDays.length > 0 ? draft.workDays.join(", ") : "미입력";
}

function formatDocumentSummary(draft: HiringDraft) {
	return hiringDocumentKeys.map(key => `${hiringDocumentLabels[key]} ${draft.documents[key] ? "확인" : "미확인"}`).join(" / ");
}

function formatContractDate() {
	const [year, month, day] = getKoreaTodayKey().split("-");

	return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function signatureImage(imageDataUrl?: string) {
	if (!imageDataUrl) {
		return "";
	}

	return `<img class="floating-signature" src="${imageDataUrl}" />`;
}

function contractStyles() {
	return `
		<style>
			@page {
				size: A4 portrait;
				margin: 18mm 16mm;
			}
			* { box-sizing: border-box; }
			html {
				width: 210mm;
				min-height: 297mm;
			}
			body {
				margin: 0;
				padding: 0;
				color: #111827;
				font-family: "Noto Serif KR", "Batang", "Times New Roman", serif;
				font-size: 17px;
				line-height: 1.72;
			}
			.contract-title {
				width: 480px;
				margin: 0 auto 34px;
				border: 1px solid #111827;
				padding: 8px 12px;
				text-align: center;
				font-size: 26px;
				font-weight: 700;
			}
			.parties {
				margin-bottom: 20px;
				text-align: center;
			}
			.line {
				display: inline-block;
				min-width: 168px;
				border-bottom: 1px solid #111827;
				height: 24px;
				vertical-align: middle;
			}
			ol {
				margin: 0;
				padding-left: 26px;
			}
			li {
				margin: 7px 0;
				padding-left: 4px;
			}
			.sub {
				margin: 2px 0 2px 22px;
			}
			.center-date {
				margin: 28px 0 20px;
				text-align: center;
				letter-spacing: 4px;
			}
			.sign-section {
				margin-top: 10px;
			}
			.sign-list {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.party-block {
				display: flex;
				flex-direction: row;
				align-items: flex-start;
				justify-content: space-between;
				gap: 18px;
			}
			.party-info {
				display: grid;
				grid-template-columns: 64px 1fr;
				flex: 1;
				row-gap: 6px;
				column-gap: 6px;
				min-width: 0;
			}
			.party-title {
				grid-column: 1 / -1;
				margin-bottom: 0;
				font-weight: 700;
			}
			.party-label {
				white-space: nowrap;
			}
			.party-value {
				min-width: 0;
			}
			.party-signature {
				display: flex;
				flex-direction: row;
				align-items: flex-end;
				gap: 8px;
				padding-top: 28px;
			}
			.sign-slot {
				position: relative;
				display: inline-block;
				width: 148px;
				height: 42px;
				border-bottom: 1px solid #111827;
				vertical-align: bottom;
			}
			.sign-text {
				white-space: nowrap;
			}
			.floating-signature {
				position: absolute;
				left: 4px;
				right: 4px;
				bottom: -4px;
				width: 140px;
				height: 50px;
				object-fit: contain;
				pointer-events: none;
			}
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
				<h1 class="contract-title">${title}</h1>
				${body}
			</body>
		</html>
	`;
}

function contractBody(draft: HiringDraft, signatures: PartialHiringSignatureImages = {}) {
	const workTime = {
		end: draft.workEndMinutes === null ? "" : formatClockMinutes(draft.workEndMinutes),
		start: draft.workStartMinutes === null ? "" : formatClockMinutes(draft.workStartMinutes),
	};
	const contractDate = formatContractDate();

	return `
		<p class="parties">
			이하 “사업주”라 함과 이하 “근로자”라 함은 다음과 같이 근로계약을 체결한다.
		</p>
		<ol>
			<li>근로개시일 : ${valueOrDash(draft.startDate)}</li>
			<li>근무장소 : ${valueOrDash(draft.storeName)} / ${valueOrDash(draft.storeAddress)}</li>
			<li>업무의 내용 : ${valueOrDash(draft.workCondition)}</li>
			<li>소정근로시간 : ${valueOrDash(workTime.start)}부터 ${valueOrDash(workTime.end)}까지</li>
			<li>근무일 : 매주 ${escapeHtml(formatWorkDays(draft))}</li>
			<li>
				임금
				<p class="sub">- 시간급여 : ${escapeHtml(formatWonText(draft.hourlyWage))}</p>
				<p class="sub">- 임금지급일 : 매월 지정 지급일</p>
				<p class="sub">- 지급방법 : 근로자 명의 예금통장에 입금</p>
			</li>
			<li>
				근로계약서 교부
				<p class="sub">- 사업주는 근로계약 체결과 동시에 본 계약서를 근로자에게 교부한다.</p>
			</li>
			<li>
				기타
				<p class="sub">- 이 계약에 정함이 없는 사항은 근로기준법령에 의한다.</p>
				<p class="sub">- 필수 제출 서류 : ${escapeHtml(formatDocumentSummary(draft))}</p>
				<p class="sub">- 특약 : ${valueOrDash(draft.contractMemo)}</p>
			</li>
		</ol>
		<p class="center-date">${escapeHtml(contractDate)}</p>
		<div class="sign-section">
			<div class="sign-list">
				<div class="party-block">
					<div class="party-info">
						<div class="party-title">(사업주)</div>
						<div class="party-label">대표자 :</div>
						<div class="party-value">${valueOrDash(hiringOwnerName)}</div>
						<div class="party-label">주소 :</div>
						<div class="party-value">${valueOrDash(draft.storeAddress)}</div>
						<div class="party-label">연락처 :</div>
						<div class="party-value">${valueOrDash(draft.storePhone)}</div>
					</div>
					<div class="party-signature">
						<span class="sign-text">(서명)</span>
						<span class="sign-slot">${signatureImage(signatures.ownerSignatureImageDataUrl)}</span>
					</div>
				</div>
				<div class="party-block">
					<div class="party-info">
						<div class="party-title">(근로자)</div>
						<div class="party-label">성명 :</div>
						<div class="party-value">${valueOrDash(draft.employeeName)}</div>
						<div class="party-label">주소 :</div>
						<div class="party-value">${valueOrDash(draft.address)}</div>
						<div class="party-label">연락처 :</div>
						<div class="party-value">${valueOrDash(draft.phone)}</div>
					</div>
					<div class="party-signature">
						<span class="sign-text">(서명)</span>
						<span class="sign-slot">${signatureImage(signatures.employeeSignatureImageDataUrl)}</span>
					</div>
				</div>
			</div>
		</div>
	`;
}

export function createHiringContractPages(draft: HiringDraft, signatures: PartialHiringSignatureImages = {}): HiringContractPage[] {
	return [
		{
			id: "standard-contract",
			title: "단시간근로자 표준근로계약서",
			html: pageShell("단시간근로자 표준근로계약서", contractBody(draft, signatures)),
		},
	];
}

export function createHiringContractHtml(draft: HiringDraft, signatures: HiringSignatureImages) {
	return pageShell("단시간근로자 표준근로계약서", contractBody(draft, signatures));
}

export function createHiringSummary(draft: HiringDraft) {
	const workTime =
		draft.workStartMinutes === null || draft.workEndMinutes === null
			? "미입력"
			: `${formatClockMinutes(draft.workStartMinutes)} - ${formatClockMinutes(draft.workEndMinutes)}`;

	return [
		{ label: "1. 근로개시일", value: draft.startDate || "미입력" },
		{ label: "2. 근무장소", value: `${draft.storeName || "미입력"} / ${draft.storeAddress || "미입력"}` },
		{ label: "3. 업무의 내용", value: draft.workCondition || "미입력" },
		{ label: "4. 소정근로시간", value: workTime },
		{ label: "5. 근무일/휴일", value: `매주 ${formatWorkDays(draft)}` },
		{ label: "6. 임금", value: formatWonText(draft.hourlyWage) },
		{ label: "7. 계약서 교부", value: "근로계약 체결과 동시에 교부" },
		{ label: "8. 기타", value: draft.contractMemo || "근로기준법령에 의함" },
	];
}
