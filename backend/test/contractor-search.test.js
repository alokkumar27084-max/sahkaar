const { test } = require('node:test');
const assert = require('assert');
const db = require('../src/config/db');
const Contractor = require('../src/models/contractorModel');

test('contractor search filters by coordinates and orders by nearest first', async () => {
  const originalQuery = db.query;
  let capturedSql = '';
  let capturedParams = [];

  db.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return { rows: [] };
  };

  try {
    await Contractor.search({
      q: 'wiring',
      lat: '23.2599',
      lng: '77.4126',
      radius_km: '5',
      sort: 'distance',
      page: 1,
      limit: 20,
    });

    assert.match(capturedSql, /earth_distance/);
    assert.match(capturedSql, /BETWEEN/);
    assert.match(capturedSql, /ORDER BY distance_km ASC/);
    assert.match(capturedSql, /unnest\(COALESCE\(c\.services/);
    assert.deepStrictEqual(capturedParams.slice(1, 5), [23.2599, 77.4126, 5000, 0]);
  } finally {
    db.query = originalQuery;
  }
});

test('contractor search keeps price sorting inside the selected radius', async () => {
  const originalQuery = db.query;
  let capturedSql = '';

  db.query = async (sql) => {
    capturedSql = sql;
    return { rows: [] };
  };

  try {
    await Contractor.search({
      lat: '23.2599',
      lng: '77.4126',
      radius_km: '10',
      sort: 'price',
    });

    assert.match(capturedSql, /earth_distance/);
    assert.match(capturedSql, /ORDER BY c\.daily_rate ASC NULLS LAST, distance_km ASC/);
  } finally {
    db.query = originalQuery;
  }
});
