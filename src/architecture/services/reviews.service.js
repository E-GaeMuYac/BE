const ReviewRepository = require('../repositories/reviews.repository');
const { Users, Likes, Dislikes } = require('../../models');
const {
  InvalidParamsError,
} = require('../../middlewares/exceptions/error.class');

class ReviewService {
  constructor() {
    this.reviewRepository = new ReviewRepository();
  }

  createReview = async (medicineId, userId, review) => {
    await this.reviewRepository.createReview(medicineId, userId, review);
  };

  findReview = async (medicineId, page, pageSize, loginUserId) => {
    const reviews = await this.reviewRepository.findReview({
      raw: true,
      where: { medicineId },
      include: [
        {
          model: Users,
          attributes: ['nickname'],
        },
        {
          model: Likes,
          as: 'Likes',
          attributes: [],
          duplicating: false,
          required: false,
        },
        {
          model: Dislikes,
          as: 'Dislikes',
          attributes: [],
          duplicating: false,
          required: false,
        },
      ],
      attributes: [
        'reviewId',
        'userId',
        'medicineId',
        'review',
        'updatedAt',
        [
          Likes.sequelize.fn('count', Likes.sequelize.col('Likes.reviewId')),
          'likeCount',
        ],
        [
          Dislikes.sequelize.fn(
            'count',
            Dislikes.sequelize.col('Dislikes.reviewId')
          ),
          'dislikeCount',
        ],
      ],
      group: ['reviewId'],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize),
    });

    return await Promise.all(
      reviews.map(async (review) => {
        let like = await this.reviewRepository.findLike(
          review.reviewId,
          loginUserId
        );

        let dislike = await this.reviewRepository.findDislike(
          review.reviewId,
          loginUserId
        );
        let likeValue = false;
        let dislikeValue = false;
        if (like) {
          likeValue = true;
        }
        if (dislike) {
          dislikeValue = true;
        }
        let likeCount = await this.reviewRepository.findLike(
          review.reviewId,
          loginUserId
        );
        let dislikeCount = await this.reviewRepository.findDislike(
          review.reviewId,
          loginUserId
        );

        return {
          reviewId: review.reviewId,
          userId: review.userId,
          like: likeValue,
          dislike: dislikeValue,
          likeCount: review.likeCount,
          dislikeCount: review.dislikeCount,
          medicineId: review.medicineId,
          review: review.review,
          updatedAt: review.updatedAt,
          nickname: review['User.nickname'],
        };
      })
    );
  };

  updateReview = async (reviewId, review, userId) => {
    const changeReview = await this.reviewRepository.findOneReview(reviewId);

    if (!changeReview) {
      throw new InvalidParamsError('리뷰를 찾을 수 없습니다.', 404);
    }

    if (userId !== changeReview.userId) {
      throw new InvalidParamsError('유저 권한이 없습니다.', 401);
    }
    await this.reviewRepository.updateReview(review, reviewId);
    return this.reviewRepository.findOneReview(reviewId);
  };

  deleteReview = async (reviewId, userId) => {
    const delReview = await this.reviewRepository.findOneReview(reviewId);

    if (delReview == null) {
      throw new InvalidParamsError('리뷰를 찾을 수 없습니다.', 404);
    }
    if (userId !== delReview.userId) {
      throw new InvalidParamsError('유저 권한이 없습니다.', 401);
    }
    await this.reviewRepository.deleteReview(reviewId);
  };
}

module.exports = ReviewService;