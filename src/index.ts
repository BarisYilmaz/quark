import { isPackageInstalled, isValidURL } from "./utils/node";
import NTPClient, { NTP_EVENTS } from "ntp.js";

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
	 * @type {object}
	 * @description Custom bit allocation
	 */
	customAllocation?: Partial<Allocations>;

	/**
	 * @type {boolean}
	 * @description Throw error if invalid arguments are passed
	 */
	throwError?: boolean;

	/**
	 * @type {object}
	 * @description Time synchronization options for ntp.js
	 */
	timeSynchronization?: {
		enabled?: boolean;
		poolServerName?: string;
		timeOffset?: number;
		updateInterval?: number;
		maxRetries?: number;
		port?: number;
	};
};

interface QuarkType {
	/**
	 * @description Generates a quark
	 * @returns {bigint}
	 */
	generate(): bigint;

	/**
	 * @description Extracts timestamp, machineId and sequence from a quark
	 * @param {bigint} quark
	 * @returns {object}
	 */
	extract(quark: bigint): {
		timestamp: number;
		machineId: number;
		sequence: number;
	};

	/**
	 * @description Extracts timestamp from a quark
	 * @param {bigint} quark
	 * @returns {number}
	 */
	extractTimestamp(quark: bigint): number;

	/**
	 * @description Extracts date from a quark
	 * @param {bigint} quark
	 * @returns {Date}
	 */
	extractDate(quark: bigint): Date;

	/**
	 * @description Extracts machineId from a quark
	 * @param {bigint} quark
	 * @returns {number}
	 */
	extractMachineId(quark: bigint): number;

	/**
	 * @description Extracts sequence from a quark
	 * @param {bigint} quark
	 * @returns {number}
	 */
	extractSequence(quark: bigint): number;
}

const bigIntMax = (...args: bigint[]): bigint =>
	args.reduce((prev, cur) => (cur > prev ? cur : prev));

const extractNumRange = (num: bigint, start: bigint, end: bigint) =>
	(num & ((1n << end) - 1n)) >> start;

export class Quark implements QuarkType {
	private machineId: number;
	private lastTimestamp = -1n;
	private sequence = 0n;
	private epoch = 0n;
	private allocations: Allocations = {
		machineId: 10,
		sequence: 12,
	};

	private ntpClient: NTPClient | null = null;
	timeDifference = 0;

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
		if (typeof a === "object") {
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
					...(options.customAllocation ?? {}),
				},
			};
		} else {
			//if (Math.random() > 0.5)
			if (options.throwError) throw new Error("Invalid arguments"); // This will never be reached, just to satisfy myself
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

		if (options.timeSynchronization?.enabled) {
			if (!isPackageInstalled("ntp.js")) {
				console.warn("You must install ntp.js to use time synchronization");
				if (options.throwError) throw new Error("You must install ntp.js to use time synchronization");
				options.timeSynchronization.enabled = false;
			}
		}

		this.machineId = options.machineId!;
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

		if (options.timeSynchronization?.enabled) {
			let poolServerName = options.timeSynchronization.poolServerName ?? "pool.ntp.org";

			if (!isValidURL(poolServerName)) {
				if (options.throwError) throw new Error("Invalid NTP pool server name");
				poolServerName = "pool.ntp.org";
			}

			let timeOffset = options.timeSynchronization.timeOffset ?? 0;

			if (timeOffset < -10000 || timeOffset > 10000) {
				if (options.throwError) throw new Error("Time offset should be between -10 seconds and 10 seconds");
				timeOffset = 0;
			}

			let updateInterval = options.timeSynchronization.updateInterval ?? 60000;

			if (updateInterval < 1000 || updateInterval > 86400000) {
				if (options.throwError) throw new Error("Update interval should be between 1 second and 24 hours");
				updateInterval = 60000;
			}

			let maxRetries = options.timeSynchronization.maxRetries ?? 5;

			if (maxRetries < 1 || maxRetries > 10) {
				if (options.throwError) throw new Error("Max retries should be between 1 and 10");
				maxRetries = 5;
			}

			this.ntpClient = new NTPClient({
				poolServerName: poolServerName ?? "pool.ntp.org",
				updateInterval: updateInterval ?? 60000,
				maxRetries: maxRetries ?? 5,
				port: options.timeSynchronization.port ?? 123,
				timeOffset: timeOffset ?? 0,
			});

			this.ntpClient.on(NTP_EVENTS.SYNC, (time) => {
				this.timeDifference = time - Date.now();
			});

			this.ntpClient.on(NTP_EVENTS.ERROR, (error) => {
				if (options.throwError) throw new Error("Error synchronizing time");
			});

			this.ntpClient.begin();
		}
	}

	generate() {
		const adjustedTime = Math.round(Date.now() + this.timeDifference);
		let timestamp = bigIntMax(BigInt(adjustedTime) - this.epoch, 1n);

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

	extract(quark: bigint) {
		return {
			timestamp: this.extractTimestamp(quark),
			machineId: this.extractMachineId(quark),
			sequence: this.extractSequence(quark),
		};
	}

	extractTimestamp(quark: bigint) {
		return Number((quark >> 22n) + this.epoch);
	}

	extractDate(quark: bigint) {
		return new Date(this.extractTimestamp(quark));
	}

	extractMachineId(quark: bigint) {
		return Number(
			extractNumRange(
				quark,
				BigInt(this.allocations.sequence),
				BigInt(this.allocations.sequence + this.allocations.machineId)
			)
		);
	}

	extractSequence(quark: bigint) {
		return Number(
			extractNumRange(quark, 0n, BigInt(this.allocations.sequence))
		);
	}
}