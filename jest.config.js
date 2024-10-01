/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	testEnvironment: "node",
	transform: {
		"^.+.tsx?$": ["ts-jest", { useESM: true, isolatedModules: true }],
	},
	testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.[jt]sx?$",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	collectCoverage: true,
	testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
