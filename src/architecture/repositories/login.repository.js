const { Users } = require('../../models');

class LoginRepository {
  existUser = async (email) => {
    const user = await Users.findOne(
      // 2. Users에 ExistUser의 email이 있는지 찾아본다.

      { raw: true, where: { email } } // Users에서 findOne 하고 where절에서 일치하는 email만 데려온다.
    );
    return user;
  };

  updateUser = async (userId, refreshtoken) => {
    await Users.update(
      { refreshtoken }, // ->userId가 일치하면, refresh token을 갱신(update)해준다.
      { where: { userId } } // Users에서 일치하는 userId만 데려온다.
    );
  };
}

module.exports = LoginRepository;

// access token + refresh token = service에서 발급 완료
// refresh token => db에 저장해준다. 왜?
// access token이 만료되었을 경우, db에 저장되어있는 refresh token이 헤더에 있는 refresh token과 비교후 일치하면 access token을 재발급해준다.
// 비교를 어떻게하지?- 미들웨어
// db refresh token을 저장을 어떻게 해야하지?
// 단, access token의 userId와 refresh token의 userId는 비교불가