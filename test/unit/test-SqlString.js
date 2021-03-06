const assert = require('assert');
const SqlString = require('../../lib/SqlString');
const test = require('utest');

test('SqlString.escapeId', {
  'value is quoted': function() {
    assert.equal(SqlString.escapeId('id'), '[id]');
  },

  'value can be a number': function() {
    assert.equal(SqlString.escapeId(42), '[42]');
  },

  'value can be an object': function() {
      assert.equal(SqlString.escapeId({}), '[[object Object]]]');
  },

  'value toString is called': function() {
    assert.equal(SqlString.escapeId({
      toString: function() {
        return 'foo';
      }
    }), '[foo]');
  },

  'value toString is quoted': function() {
    assert.equal(SqlString.escapeId({
      toString: function() {
        return '[foo]';
      }
  }), '[[foo]]]');
  },

  'value containing escapes is quoted': function() {
    assert.equal(SqlString.escapeId('i]d'), '[i]]d]');
  },

  'value containing double-quotes is escaped with backtips': function() {
    assert.equal(SqlString.escapeId('i"d'), '[i"d]');
  },

  'value containing separator is quoted': function() {
    assert.equal(SqlString.escapeId('id1.id2'), '[id1].[id2]');
  },

  'value containing separator and escapes is quoted': function() {
    assert.equal(SqlString.escapeId('id[1.i]d2'), '[id[1].[i]]d2]');
  },

  'value containing separator is fully escaped when forbidQualified': function() {
    assert.equal(SqlString.escapeId('id1.id2', true), '[id1.id2]');
  },

  'arrays are turned into lists': function() {
    assert.equal(SqlString.escapeId(['a', 'b', 't.c']), '[a], [b], [t].[c]');
  },

  'nested arrays are flattened': function() {
    assert.equal(SqlString.escapeId(['a', ['b', ['t.c']]]), '[a], [b], [t].[c]');
  }
});

test('SqlString.escape', {
  'undefined -> NULL': function() {
    assert.equal(SqlString.escape(undefined), 'NULL');
  },

  'null -> NULL': function() {
    assert.equal(SqlString.escape(null), 'NULL');
  },

  'booleans convert to bit strings': function() {
    assert.equal(SqlString.escape(false), '0');
    assert.equal(SqlString.escape(true), '1');
  },

  'numbers convert to strings': function() {
    assert.equal(SqlString.escape(5), '5');
  },

  'raw not escaped': function() {
    assert.equal(SqlString.escape(SqlString.raw('getdate()')), 'getdate()');
  },

  'objects are turned into key value pairs': function() {
    assert.equal(SqlString.escape({
      a: 'b',
      c: 'd'
    }), "[a] = 'b', [c] = 'd'");
  },

  'objects function properties are ignored': function() {
    assert.equal(SqlString.escape({
      a: 'b',
      c: function() {}
    }), "[a] = 'b'");
  },

  'object values toSqlString is called': function() {
    assert.equal(SqlString.escape({
      id: {
        toSqlString: function() {
          return 'LAST_INSERT_ID()';
        }
      }
    }), '[id] = LAST_INSERT_ID()');
  },

  // 'objects toSqlString is called': function() {
  //   assert.equal(SqlString.escape({ toSqlString: function() { return '@foo_id'; } }), '@foo_id');
  // },

  'objects toSqlString is not quoted': function() {
    assert.equal(SqlString.escape({
      toSqlString: function() {
        return 'getdate()';
      }
    }), 'getdate()');
  },

  'nested objects are cast to strings': function() {
    assert.equal(SqlString.escape({
      a: {
        nested: true
      }
    }), "[a] = '[object Object]'");
  },

  'nested objects use toString': function() {
    assert.equal(SqlString.escape({
      a: {
        toString: function() {
          return 'foo';
        }
      }
    }), "[a] = 'foo'");
  },

  'nested objects use toString is quoted': function() {
    assert.equal(SqlString.escape({
      a: {
        toString: function() {
          return "f'oo";
        }
      }
    }), "[a] = 'f''oo'");
  },

  'arrays are turned into lists': function() {
    assert.equal(SqlString.escape([1, 2, 'c']), "1, 2, 'c'");
  },

  'nested arrays are turned into grouped lists': function() {
    assert.equal(SqlString.escape([
      [1, 2, 3],
      [4, 5, 6],
      ['a', 'b', {
        nested: true
      }]
    ]), "(1, 2, 3), (4, 5, 6), ('a', 'b', '[object Object]')");
  },

  'nested objects inside arrays are cast to strings': function() {
    assert.equal(SqlString.escape([1, {
      nested: true
    }, 2]), "1, '[object Object]', 2");
  },

  'nested objects inside arrays use toString': function() {
    assert.equal(SqlString.escape([1, {
      toString: function() {
        return 'foo';
      }
    }, 2]), "1, 'foo', 2");
  },

  'strings are quoted': function() {
    assert.equal(SqlString.escape('Super'), "'Super'");
  },

  '\b gets escaped': function() {
    assert.equal(SqlString.escape('Sup\ber'), "'Sup\\ber'");
    assert.equal(SqlString.escape('Super\b'), "'Super\\b'");
  },

  '\f gets escaped': function() {
    assert.equal(SqlString.escape('Sup\fer'), "'Sup\\fer'");
    assert.equal(SqlString.escape('Super\f'), "'Super\\f'");
  },

  '\n gets escaped': function() {
    assert.equal(SqlString.escape('Sup\ner'), "'Sup\\ner'");
    assert.equal(SqlString.escape('Super\n'), "'Super\\n'");
  },

  '\r gets escaped': function() {
    assert.equal(SqlString.escape('Sup\rer'), "'Sup\\rer'");
    assert.equal(SqlString.escape('Super\r'), "'Super\\r'");
  },

  '\t gets escaped': function() {
    assert.equal(SqlString.escape('Sup\ter'), "'Sup\\ter'");
    assert.equal(SqlString.escape('Super\t'), "'Super\\t'");
  },

  '/ gets escaped': function() {
    assert.equal(SqlString.escape('Sup/er'), "'Sup\/er'");
    assert.equal(SqlString.escape('Super/'), "'Super\/'");
  },

  '\\ gets escaped': function() {
    assert.equal(SqlString.escape('Sup\\er'), "'Sup\\\\er'");
    assert.equal(SqlString.escape('Super\\'), "'Super\\\\'");
  },

  'CHAR(0) gets replaced with \u0000': function() {
    assert.equal(SqlString.escape('Sup\u001aer'), "'Sup\\Zer'");
    assert.equal(SqlString.escape('Super\u001a'), "'Super\\Z'");
  },

  'CHAR(1) gets replaced with \u0001': function() {
    assert.equal(SqlString.escape('Sup\u001aer'), "'Sup\\Zer'");
    assert.equal(SqlString.escape('Super\u001a'), "'Super\\Z'");
  },

  'single quotes get escaped': function() {
    assert.equal(SqlString.escape('Sup\'er'), "'Sup''er'");
    assert.equal(SqlString.escape('Super\''), "'Super'''");
  },

  'dates are converted to YYYY-MM-DD HH:II:SS.sss': function() {
    const expected = '2012-05-07 11:42:03.002';
    const date = new Date(2012, 4, 7, 11, 42, 3, 2);
    const string = SqlString.escape(date);

    assert.strictEqual(string, `'${expected}'`);
  },

  'dates are converted to specified time zone "Z"': function() {
    const expected = '2012-05-07 11:42:03.002';
    const date = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    const string = SqlString.escape(date, false, 'Z');

    assert.strictEqual(string, `'${expected}'`);
  },

  'dates are converted to specified time zone "+01"': function() {
    const expected = '2012-05-07 12:42:03.002';
    const date = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    const string = SqlString.escape(date, false, '+01');

    assert.strictEqual(string, `'${expected}'`);
  },

  'dates are converted to specified time zone "+0200"': function() {
    const expected = '2012-05-07 13:42:03.002';
    const date = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    const string = SqlString.escape(date, false, '+0200');

    assert.strictEqual(string, `'${expected}'`);
  },

  'dates are converted to specified time zone "-05:00"': function() {
    const expected = '2012-05-07 06:42:03.002';
    const date = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    const string = SqlString.escape(date, false, '-05:00');

    assert.strictEqual(string, `'${expected}'`);
  },

  'dates are converted to UTC for unknown time zone': function() {
    const date = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    const expected = SqlString.escape(date, false, 'Z');
    const string = SqlString.escape(date, false, 'foo');

    assert.strictEqual(string, expected);
  },

  'invalid dates are converted to null': function() {
    const date = new Date(NaN);
    const string = SqlString.escape(date);

    assert.strictEqual(string, 'NULL');
  },

  // 'buffers are converted to hex': function() {
  //   const buffer = new Buffer([0, 1, 254, 255]);
  //   const string = SqlString.escape(buffer);
  //
  //   assert.strictEqual(string, "X'0001feff'");
  // },
  //
  // 'buffers object cannot inject SQL': function() {
  //   const buffer = new Buffer([0, 1, 254, 255]);
  //   buffer.toString = function() {
  //     return "00' OR '1'='1";
  //   };
  //   const string = SqlString.escape(buffer);
  //
  //   assert.strictEqual(string, "X'00\\' OR \\'1\\'=\\'1'");
  // },

  'NaN -> NaN': function() {
    assert.equal(SqlString.escape(NaN), 'NaN');
  },

  'Infinity -> Infinity': function() {
    assert.equal(SqlString.escape(Infinity), 'Infinity');
  }
});

test('SqlString.format', {
  'question marks are replaced with escaped array values': function() {
    const sql = SqlString.format('? and ?', ['a', 'b']);
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are replaced with escaped id': function() {
    const sql = SqlString.format('SELECT * FROM ?? WHERE id = ?', ['table', 42]);
    assert.equal(sql, 'SELECT * FROM [table] WHERE id = 42');
  },

  'triple question marks are ignored': function() {
    const sql = SqlString.format('? or ??? and ?', ['foo', 'bar', 'fizz', 'buzz']);
    assert.equal(sql, "'foo' or ??? and 'bar'");
  },

  'extra question marks are left untouched': function() {
    const sql = SqlString.format('? and ?', ['a']);
    assert.equal(sql, "'a' and ?");
  },

  'extra arguments are not used': function() {
    const sql = SqlString.format('? and ?', ['a', 'b', 'c']);
    assert.equal(sql, "'a' and 'b'");
  },

  'question marks within values do not cause issues': function() {
    const sql = SqlString.format('? and ?', ['hello?', 'b']);
    assert.equal(sql, "'hello?' and 'b'");
  },

  'undefined is ignored': function() {
    const sql = SqlString.format('?', undefined, false);
    assert.equal(sql, '?');
  },

  'objects is converted to values': function() {
    const sql = SqlString.format('?', {
      'hello': 'world'
    }, false);
    assert.equal(sql, "[hello] = 'world'");
  },

  'objects is not converted to values': function() {
    let sql = SqlString.format('?', {
      'hello': 'world'
    }, true);
    assert.equal(sql, "'[object Object]'");

    sql = SqlString.format('?', {
      toString: function() {
        return 'hello';
      }
    }, true);
    assert.equal(sql, "'hello'");

    // const sql = SqlString.format('?', {
    //   toSqlString: function() {
    //     return '@foo';
    //   }
    // }, true);
    // assert.equal(sql, '@foo');
  },

  'sql is untouched if no values are provided': function() {
    const sql = SqlString.format('SELECT ??');
    assert.equal(sql, 'SELECT ??');
  },

  'sql is untouched if values are provided but there are no placeholders': function() {
    const sql = SqlString.format('SELECT COUNT(*) FROM table', ['a', 'b']);
    assert.equal(sql, 'SELECT COUNT(*) FROM table');
  }
});

test('SqlString.raw', {
  'creates object': function() {
    assert.equal(typeof SqlString.raw('getdate()'), 'object');
  },

  'rejects number': function() {
    assert.throws(function() {
      SqlString.raw(42);
    });
  },

  'rejects undefined': function() {
    assert.throws(function() {
      SqlString.raw();
    });
  },

  'object has toSqlString': function() {
    assert.equal(typeof SqlString.raw('getdate()').toSqlString, 'function');
  },

  'toSqlString returns sql as-is': function() {
    assert.equal(SqlString.raw("getdate() AS 'current_time'").toSqlString(), "getdate() AS 'current_time'");
  }
});
