var helpers = require('./../../../helpers'),
    should = require('should'),
    sinon = require('sinon'),
    lib_path = helpers.lib_path(),
    join = require('path').join,
    system = require(join(lib_path, 'common')).system,
    child_process = require('child_process'),
    os = require('os'),
    mock_spawn = require('mock-spawn'),
    mocked_spawn = mock_spawn(),
    lock; // require later otherwise os.platform stub won't work

var win_versions = {
  old: {
    'xp': '5.1',
    'xp 64bit': '5.2',
    'vista': '6.0',
    '7': '6.1'
  },
  new: {
    '8': '6.2',
    '8.1': '6.3',
    '10': '10'
  }
};

describe('in Windows OS', function() {

  var os_stub,
      spawn_stub,
      platform_stub,
      versions; //used to iterate over the old or new windows versions object

  before(function () {
    child_process.spawn = mocked_spawn;
    mocked_spawn.setDefault(mocked_spawn.simple(66, 'completed'));


    platform_stub = sinon.stub(os, 'platform', function() { return 'win32'; });

    spawn_stub = sinon.stub(system, 'spawn_as_logged_user', function(binary, args, opts, cb) {
      var spawn = child_process.spawn();
      return cb(null, spawn);
    });

  });

  beforeEach(function() {
    spawn_stub.reset();
  });

  after(function() {
    spawn_stub.restore();
    platform_stub.restore();
  });

  describe('when running in old versions of Windows', function() {
    iterate_versions(win_versions.old, 'prey-lock');
  });

  describe('when running in Windows 8+', function() {
    iterate_versions(win_versions.new, 'new-prey-lock');
  });

  function stub_os_release(version) {
    os_stub = sinon.stub(os, 'release', function() { return version });
  }

  function unstub_os_release() {
    os_stub.restore();
  }

  function iterate_versions(versions, binary) {
    Object.keys(versions).forEach(function(k) {
      test_version(k, versions[k], binary);
    });
  }

  function test_version(version_name, version, expected_bin) {

    describe('win ' + version_name, function() {

      before(function() {
        stub_os_release(version);

        // need to reload lock after each os release version has been stubbed
        var lock_path = join(lib_path, 'agent', 'actions', 'lock');
        delete require.cache[require.resolve(lock_path)]; // clean require cache
        lock = require(lock_path);
      });

      after(function() {
        unstub_os_release();
      });

      it('calls ' + expected_bin + ' binary', function(done) {
        lock.start(null, function(err, lock) {
          check_binary(expected_bin, done);
        });
      });

    });

  };

  function check_binary(name, done) {
    spawn_stub.calledOnce.should.be.true;
    get_binary(spawn_stub.firstCall.args[0]).should.eql(name);
    done();
  };

  function get_binary(path) {
    var regex = /[^\/]+$/;
    return regex.exec(path)[0];
  }

});
