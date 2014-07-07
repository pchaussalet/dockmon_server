var rewire = require('rewire');
var chai = require('chai');
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var q = require('q');

describe('allUsers', function() {
    var allUsers;

    beforeEach(function() {
        allUsers = rewire('../services/allUsers');
    });

    describe('findByEmail', function() {
        it('should return user info when a matching user exists', function() {
            var usersMock = {
                findOne: function() {
                    var deferred = q.defer();
                    deferred.resolve({email: 'foo@bar.baz'});
                    return deferred.promise;
                }
            };
            allUsers.__set__('users', usersMock);

            return allUsers.findByEmail('foo@bar.baz')
                .should.be.fulfilled
                .and.eventually.have.property('email').with.equal('foo@bar.baz');
        });

        it('should reject with a NOT_FOUND cause when no matching user exists', function() {
            var usersMock = {
                findOne: function() {
                    var deferred = q.defer();
                    deferred.resolve();
                    return deferred.promise;
                }
            };
            allUsers.__set__('users', usersMock);

            return allUsers.findByEmail('foo@bar.baz')
                .should.be.rejected
                .and.eventually.have.property('cause').with.equal(allUsers.NOT_FOUND);
        });

        it('should reject without cause when an error has occurred', function() {
            var usersMock = {
                findOne: function() {
                    var deferred = q.defer();
                    deferred.reject(new Error());
                    return deferred.promise;
                }
            };
            allUsers.__set__('users', usersMock);

            return allUsers.findByEmail('foo@bar.baz')
                .should.be.rejected
                .and.eventually.not.have.property('cause');
        });
    });

    describe('connect', function() {
        it('should add a new user when the address is unknown', function() {
            var startTime = new Date().getTime();
            var usersMock = {
                users:  [],
                findAndModify: function(query, sort, document, options) {
                    var deferred = q.defer();
                    var user = query;
                    var keys = Object.keys(document.$set);
                    keys.forEach(function(key) {
                        user[key] = document.$set[key];
                    });
                    this.users.push(user);
                    deferred.resolve(user);
                    return deferred.promise;
                }
            };
            allUsers.__set__('users', usersMock);

            var promise = allUsers.connect({email: 'foo@bar.baz'});

            var result = promise.should.be.fulfilled;
            result = result.message == null ? promise.should.eventually.have.property('email').with.equal('foo@bar.baz') : result;
            result = result.message == null ? promise.should.eventually.have.property('lastConnection').with.gte(startTime) : result;
            usersMock.users.should.have.length(1);
            usersMock.users[0].should.have.property('email').with.equal('foo@bar.baz');
            return result;
        });
    });
});
