/**
 * @module quark
 * @description A module for generating and extracting quark identifiers.
 * 
 * @example
 * ```ts
 * import Quark from "@hadron/quark";
 * 
 * const quark = new Quark(1);
 * const id = quark.generate(); // 1405698163277568000
 * const timestamp = quark.extractTimestamp(id); // 1714857363277
 * const machineId = quark.extractMachineId(id); // 1
 * const sequence = quark.extractSequence(id); // 0
 * ```
 */

/**
 * @description Bit allocation for machineId and sequence
 */
type Allocations = {
	/**
	 * @type {number}
	 * @description Machine Id bit allocation
	 */
	machineId: number;
	/**
	 * @type {number}
	 * @description Sequence bit allocation
	 */
	sequence: number;
};

/**
 * @description Options for the Quark class
 */
type QuarkOptions = {
	/**
	 * @type {number}
	 * @description Machine Id
	 */
	machineId: number;
	/**
	 * @type {number}
	 * @description Epoch time in milliseconds
	 */
	epoch?: number;
	/**
	 * @type {Partial<Allocations>}
	 * @description Custom bit allocation
	 */
	customAllocation?: Partial<Allocations>;

	throwError?: boolean;
};

const bigIntMax = (...args: bigint[]): bigint =>
	args.reduce((prev, cur) => (cur > prev ? cur : prev));

const extractNumRange = (num: bigint, start: bigint, end: bigint) =>
	(num & ((1n << end) - 1n)) >> start;

/**
 * @class Quark
 * @description A class for generating and extracting quark identifiers.
 */
export default class Quark {
	private machineId: number;
	private lastTimestamp = -1n;
	private sequence = 0n;
	private epoch = 0n;
	private allocations: Allocations = {
		machineId: 10,
		sequence: 12,
	};

	constructor(
		machineId: number,
		epoch?: number,
		options?: Omit<QuarkOptions, "machineId" | "epoch">
	);
	constructor(options: QuarkOptions);
	constructor(
		a: number | QuarkOptions,
		b?: number,
		c?: Omit<QuarkOptions, "machineId" | "epoch">
	) {
		let options: Partial<QuarkOptions> = {};
		if (a != null && typeof a === "object") {
			options = a;
		} else if (
			typeof a === "number" &&
			(b == null || typeof b === "number") &&
			(c == null || typeof c === "object")
		) {
			options = {
				machineId: a,
				epoch: b,
				customAllocation: {
					machineId: 10,
					sequence: 12,
					...(c?.customAllocation ?? {}),
				},
			};
		} else {
			// if (Math.random() > 0.5)
			// if (options.throwError) throw new Error("Invalid arguments"); // This will never be reached, just to satisfy myself
			options = {
				machineId: 1,
				epoch: 0,
				customAllocation: {
					machineId: 10,
					sequence: 12,
				},
				throwError: false,
			};
		}

		this.machineId = Math.max(options.machineId!, 0);
		this.lastTimestamp = -1n;
		this.sequence = 0n;
		this.epoch = BigInt(options.epoch ?? 0);

		if (this.epoch < 0n) {
			if (options.throwError) throw new Error("Epoch cannot be negative");
			this.epoch = 0n;
		}

		if (!isNaN(+(options.customAllocation?.machineId ?? 0))) {
			this.allocations.machineId = Math.max(
				options.customAllocation?.machineId ?? 10,
				0
			);
		}
		if (!isNaN(+(options.customAllocation?.sequence ?? 0))) {
			this.allocations.sequence = Math.max(
				options.customAllocation?.sequence ?? 12,
				0
			);
		}

		if (this.allocations.machineId + this.allocations?.sequence > 22) {
			if (options.throwError)
				throw new Error("Total bit allocation cannot exceed 22 bits");
			this.allocations.machineId = 10;
			this.allocations.sequence = 12;
		}
	}

	/**
	 * @description Generates a quark
	 * @returns {bigint}
	 */
	generate(): bigint {
		let timestamp = bigIntMax(BigInt(Date.now()) - this.epoch, 1n);

		this.sequence =
			timestamp <= this.lastTimestamp
				? extractNumRange(
						this.sequence + 1n,
						0n,
						BigInt(this.allocations.sequence)
				  )
				: 0n;
		if (!this.sequence)
			timestamp = bigIntMax(timestamp, this.lastTimestamp + 1n);

		return (
			((this.lastTimestamp = timestamp) << 22n) |
			(extractNumRange(
				BigInt(this.machineId),
				0n,
				BigInt(this.allocations.machineId)
			) <<
				BigInt(this.allocations.sequence)) |
			this.sequence
		);
	}

	/**
	 * @description Extracts timestamp, machineId and sequence from a quark
	 * @param {bigint} quark
	 * @returns {timestamp: number, machineId: number, sequence: number}
	 */
	extract(quark: bigint): {
		timestamp: number;
		machineId: number;
		sequence: number;
	} {
		return {
			timestamp: this.extractTimestamp(quark),
			machineId: this.extractMachineId(quark),
			sequence: this.extractSequence(quark),
		};
	}

	/**
	 * @description Extracts timestamp from a quark
	 * @param {bigint} quark
	 * @returns {number}
	 */
	extractTimestamp(quark: bigint): number {
		return Number((quark >> 22n) + this.epoch);
	}

	/**
	 * @description Extracts date from a quark
	 * @param {bigint} quark
	 * @returns {Date}
	 */
	extractDate(quark: bigint): Date {
		return new Date(this.extractTimestamp(quark));
	}

	/**
	 * @description Extracts machineId from a quark
	 * @param {bigint} quark
	 * @returns {number}
	 */
	extractMachineId(quark: bigint): number {
		return Number(
			extractNumRange(
				quark,
				BigInt(this.allocations.sequence),
				BigInt(this.allocations.sequence + this.allocations.machineId)
			)
		);
	}

	/**
	 * @description Extracts sequence from a quark
	 * @param {bigint} quark
	 * @returns {number}
	 */
	extractSequence(quark: bigint): number {
		return Number(
			extractNumRange(quark, 0n, BigInt(this.allocations.sequence))
		);
	}
}
