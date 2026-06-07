import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RecommendationService {
  static async getRecommendationsBasedOnFavourites(userId: string) {
    // Find user's favourite items
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        favouriteItems: {
          select: { 
            id: true,
            category: true
          }
        }
      }
    });

    if (!user || user.favouriteItems.length === 0) {
      return [];
    }

    // Get categories of favourite items
    const favouriteCategories = [...new Set(
      user.favouriteItems.map(item => item.category).filter((category): category is string => category != null)
    )];

    // Find similar items in those categories
    const recommendations = await prisma.menuItem.findMany({
      where: {
        category: { in: favouriteCategories },
        NOT: {
          id: { in: user.favouriteItems.map(item => item.id) }
        }
      },
      take: 5,
      orderBy: { viewCount: 'desc' }
    });

    return recommendations;
  }

  static async getOneClickReorder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        customer_id: userId
      },
      include: { 
        items: { 
          include: { menuItem: true } 
        } 
      }
    });

    if (!order) {
      throw new Error('Order not found or does not belong to user');
    }

    // Create a new order with the same items
    const newOrder = await prisma.order.create({
      data: {
        customer_id: userId,
        branch_id: order.branch_id,
        total_amount: order.total_amount,
        isRepeatedOrder: true,
        items: {
          create: order.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    return newOrder;
  }
}