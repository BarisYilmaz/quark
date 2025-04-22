import { Quark } from "../src/index";

describe("Quark Constructor Tests", () => {
	test("Default constructor behavior", () => {
		const quark = new Quark({ machineId: 1 });
		expect(quark).toBeInstanceOf(Quark);
	});

	test("Custom machineId", () => {
		const machineId = 5;
		const quark = new Quark({ machineId });
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["machineId"]).toBe(machineId);
	});

	test("Custom epoch", () => {
		const epoch = 1609459200000; // 2021-01-01T00:00:00.000Z
		const quark = new Quark({ machineId: 1, epoch });
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["epoch"]).toBe(BigInt(epoch));
	});

	test("Custom bit allocations", () => {
		const customAllocation = { machineId: 8, sequence: 14 };
		const quark = new Quark({ machineId: 1, customAllocation });
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["allocations"]).toEqual(customAllocation);
	});

	test("Negative epoch", () => {
		const quark = new Quark({ machineId: 1, epoch: -1000 });
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["epoch"]).toBe(0n);
	});

	test("Bit allocation exceeding limit", () => {
		const customAllocation = { machineId: 15, sequence: 10 };
		const quark = new Quark({ machineId: 1, customAllocation });
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["allocations"]).toEqual({ machineId: 10, sequence: 12 });
	});

	test("Constructor with machineId and epoch", () => {
		const machineId = 2;
		const epoch = 1609459200000; // January 1, 2021
		const quark = new Quark(machineId, epoch);

		expect(quark).toBeInstanceOf(Quark);
		expect(quark["machineId"]).toBe(machineId);
		expect(quark["epoch"]).toBe(BigInt(epoch));
	});

	test("Constructor with machineId, epoch, and options", () => {
		const machineId = 3;
		const epoch = 1609459200000; // January 1, 2021
		const options = { customAllocation: { machineId: 5, sequence: 10 } };
		const quark = new Quark(machineId, epoch, options);

		expect(quark).toBeInstanceOf(Quark);
		expect(quark["machineId"]).toBe(machineId);
		expect(quark["epoch"]).toBe(BigInt(epoch));
		expect(quark["allocations"]).toEqual({ machineId: 5, sequence: 10 });
	});

	test("Invalid arguments", () => {
		// @ts-expect-error
		expect(new Quark(null)).toBeInstanceOf(Quark);
	});
});

describe("Quark Constructor Epoch Validation Tests", () => {
	test("Negative epoch with throwError true should throw an error", () => {
		expect(() => {
			new Quark({
				machineId: 1,
				epoch: -1000,
				throwError: true,
			});
		}).toThrow("Epoch cannot be negative");
	});

	test("Negative epoch with throwError false should not throw an error", () => {
		const quark = new Quark({
			machineId: 1,
			epoch: -1000,
			throwError: false,
		});
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["epoch"]).toBe(0n);
	});
});

describe("Quark Constructor Bit Allocation Tests", () => {
	test("Total bit allocation exceeding 22 bits should throw an error", () => {
		expect(() => {
			new Quark({
				machineId: 1,
				customAllocation: { machineId: 15, sequence: 10 },
				throwError: true,
			});
		}).toThrow("Total bit allocation cannot exceed 22 bits");
	});

	test("Total bit allocation exceeding 22 bits with throwError false", () => {
		const quark = new Quark({
			machineId: 1,
			customAllocation: { machineId: 15, sequence: 10 },
			throwError: false,
		});
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["allocations"]).toEqual({ machineId: 10, sequence: 12 });
	});

	test("Total bit allocation not exceeding 22 bits should not throw an error", () => {
		const quark = new Quark({
			machineId: 1,
			customAllocation: { machineId: 10, sequence: 10 },
			throwError: false,
		});
		expect(quark).toBeInstanceOf(Quark);
		expect(quark["allocations"]).toEqual({ machineId: 10, sequence: 10 });
	});
});
