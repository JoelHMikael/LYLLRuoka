
const assert = require('node:assert').strict;

function parseLine(line) {
	const [datePart] = line.split(' ', 1);
	assert.equal(datePart !== undefined, true, `otsikkoa ei annettu rivillä ”${line}”`);
	const rest = line.substring(datePart.length + 1);
	let dateStrings = datePart.split('-');
	if (dateStrings.length === 1)
		dateStrings.push(dateStrings[0]);
	assert.equal(dateStrings.length, 2, `päivämääräväli ${datePart} on virheellinen (ks. rivi ${line})`);
	let d1   = dateStrings[0].split('.');
	const d2 = dateStrings[1].split('.');
	assert.equal(d2.length, 3, `päivämäärästä ”${dateStrings[1]}”  puuttui päivä, kuukausi tai vuosi tai se on muutoin virheellinen (ks. rivi ”${line}”)`);
	while (d1.length < 3) {
		d1.push(d2[d1.length])
	}
	for (let i = 0; i < 3; i++) {
		d1[i] = +d1[i];
		d2[i] = +d2[i];
		let opts = ['päivä', 'kuukausi', 'vuosi'];
		assert.ok(!isNaN(d1[i]), `syötetty ${opts[i]} ei koostunut pelkistä numeroista (ks. rivi ${line})`);
		assert.ok(!isNaN(d2[i]), `syötetty ${opts[i]} ei koostunut pelkistä numeroista (ks. rivi ${line})`);
	}
	const start = new Date(d1[2], d1[1] - 1, d1[0]);
	const end = new Date(d2[2], d2[1] - 1, d2[0]);
 
	let [header, message = ''] = rest.split('|', 2);
	assert.equal(header === undefined, false, 'otsikko täytyy antaa (ks. rivi ${line})');
	header = header.trimEnd();
	message = message.trimStart();
 
	return [
		start,
		end,
		header,
		message
	];
}
assert.deepEqual(
	parseLine('02.06.2024-07.08.2024 Hyvää kesää LYLLin väelle! | Kesäloma 2.6.-7.8.'),
	[
		new Date(2024, 5, 2),
		new Date(2024, 7, 7),
		'Hyvää kesää LYLLin väelle!',
		'Kesäloma 2.6.-7.8.'
	]
);

async function updateExceptions(exceptions, DB) {
	await DB.query_raw('DELETE FROM exceptions');
	let dbOperations = [];
	for (let line of exceptions.split('\n')) {
		if ((line === '') || (line === '\r') || (line[0] === '#')) {
			continue;
		}
		const [start, end, header, message] = parseLine(line);
		dbOperations.push(DB.execute(
			'INSERT INTO exceptions VALUE (?, ?, ?, ?)',
			[start, end, header, message]
		));
	}
	await Promise.all(dbOperations);
	return 0;
}

exports.updateExceptions = updateExceptions;
