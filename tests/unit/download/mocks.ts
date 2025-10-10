import { vi } from "vitest";

export const mockWorkbook = { sheets: [] } as any;
export const mockAoaToSheet = vi.fn();
export const mockBookNew = vi.fn();
export const mockWriteFile = vi.fn();
export const mockBookAppendSheet = vi.fn();
export const mockJsonToSheet = vi.fn();

vi.mock("xlsx", () => ({
  writeFile: (data: string, fileName: string) => mockWriteFile(data, fileName),
  utils: {
    aoa_to_sheet: (data: any) => mockAoaToSheet(data),
    json_to_sheet: (data: any) => mockJsonToSheet(data),
    book_new: () => mockBookNew(),
    book_append_sheet: (wb: any, ws: any, name: string) => mockBookAppendSheet(wb, ws, name),
  },
}));

export const mockImplementations = () => {
  mockJsonToSheet.mockImplementation(data => ({ data, type: "json" }));
  mockAoaToSheet.mockImplementation(data => ({ data, type: "aoa" }));
  mockBookNew.mockImplementation(() => mockWorkbook);
  mockBookAppendSheet.mockImplementation((workbook: any, worksheet: any, name: string) => {
    (workbook as any).sheets.push({ ...worksheet, name });
  });
};

export const expectMockAppendSheet = (callIndex: number, data: any, sheetName: string) => {
  expect(mockBookAppendSheet.mock.calls[callIndex][0]).toBe(mockWorkbook);
  expect(mockBookAppendSheet.mock.calls[callIndex][1]).toStrictEqual(data);
  expect(mockBookAppendSheet.mock.calls[callIndex][2]).toBe(sheetName);
};
