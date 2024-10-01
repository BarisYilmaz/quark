import { Quark } from "../src/index";

describe("Quark Functionality Tests", () => {
	test("Machine ID of 0", () => {
		const quark = new Quark({ machineId: 0 });
		expect(quark).toBeInstanceOf(Quark);
		const id = quark.generate();
		const info = quark.extract(id);
		expect(info.machineId).toBe(0);
	});

	test("Maximum Machine ID", () => {
		const maxMachineId = (1 << 10) - 1;
		const quark = new Quark({ machineId: maxMachineId });
		expect(quark).toBeInstanceOf(Quark);
		const id = quark.generate();
		const info = quark.extract(id);
		expect(info.machineId).toBe(maxMachineId);
	});

	test("Sequence overflow", () => {
		const millis = 1704067200000;
		Date.now = jest.fn(() => millis);

		const quark = new Quark({ machineId: 1 });
		expect(quark).toBeInstanceOf(Quark);
		const maxSequence = (1 << 12) - 1;

		for (let i = 0; i < maxSequence; i++) quark.generate();

		const lastId = quark.generate();
		(Date.now as jest.Mock).mockReturnValue(millis + 1);

		const newId = quark.generate();
		const info = quark.extract(newId);
		expect(info.sequence).toBe(0);
	});

	test("Custom allocation exceeding limit", () => {
		expect(() => {
			new Quark({
				machineId: 1,
				customAllocation: { machineId: 12, sequence: 12 },
				throwError: true,
			});
		}).toThrow("Total bit allocation cannot exceed 22 bits");
	});

	test("Negative machine ID", () => {
		const quark = new Quark({ machineId: -1 });
		expect(quark).toBeInstanceOf(Quark);

		const id = quark.generate();
		const info = quark.extract(id);

		expect(info.machineId).toBe(0);
	});

	test("Extract date from ID", () => {
		const quark = new Quark({ machineId: 1 });
		const id = quark.generate();
		const date = quark.extractDate(id);
		expect(date).toBeInstanceOf(Date);
	});

	test("Extract timestamp from ID", () => {
		const quark = new Quark({ machineId: 1 });
		const id = quark.generate();
		const timestamp = quark.extractTimestamp(id);
		expect(typeof timestamp).toBe("number");
	});

	test("Extract machine ID from ID", () => {
		const quark = new Quark({ machineId: 1 });
		const id = quark.generate();
		const machineId = quark.extractMachineId(id);
		expect(machineId).toBe(1);
	});

	test("Extract sequence from ID", () => {
		const quark = new Quark({ machineId: 1 });
		const id = quark.generate();
		const sequence = quark.extractSequence(id);
		expect(typeof sequence).toBe("number");
	});

	test("Generate multiple IDs", () => {
		const quark = new Quark({ machineId: 1 });
		const ids = new Set();
		for (let i = 0; i < 1000; i++) {
			ids.add(quark.generate());
		}
		expect(ids.size).toBe(1000);
	});

	test("Date.now() equals epoch should generate ID correctly", () => {
		const epoch = Date.now();
		const quark = new Quark({ machineId: 1, epoch });

		Date.now = jest.fn(() => epoch);

		const id = quark.generate();
		const info = quark.extract(id);

		expect(info.timestamp).toBe(epoch + 1);
		expect(info.machineId).toBe(1);
		expect(info.sequence).toBe(0);
	});
});
