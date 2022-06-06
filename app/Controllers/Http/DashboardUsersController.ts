import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { createResponse, getUnixTimestamp } from 'App/Helpers/Customs'
import Definition from 'App/Models/Definition'
import User from 'App/Models/User'

export default class DashboardUsersController {
  protected res: ResponseInterface = createResponse({ code: 200, status: 'Success' })

  public async index({ response, auth }: HttpContextContract): Promise<void> {
    const { id: userId, username, email }: User = auth.user!

    try {
      const definitions: Definition[] = await Definition.query()
        .preload('category')
        .preload('statusDefinition')
        .where('user_id', userId)
        .whereNot('status_definition_id', StatusDefinitions.DELETED)
        .orderBy('updated_at', 'desc')

      const dataDefinitions: Object[] = definitions.map((data) => {
        const { id, term, definition, category, statusDefinition, createdAt, updatedAt } = data
        return {
          id,
          term,
          definition,
          category: category.category,
          statusDefinition: statusDefinition.statusDefinition,
          createdAt: getUnixTimestamp(createdAt),
          updatedAt: getUnixTimestamp(updatedAt),
        }
      })

      const totaldefinitionApproved: any = await this.getTotalDefinition(
        userId,
        StatusDefinitions.APPROVED
      )

      const totaldefinitionReview: any = await this.getTotalDefinition(
        userId,
        StatusDefinitions.REVIEW
      )

      const totaldefinitionRejected: any = await this.getTotalDefinition(
        userId,
        StatusDefinitions.REJECTED
      )

      this.res.data = {
        userId,
        username,
        email,
        total_approved: totaldefinitionApproved?.total || 0,
        total_review: totaldefinitionReview?.total || 0,
        total_reject: totaldefinitionRejected?.total || 0,
        definitions: dataDefinitions,
      }

      return response.status(this.res.code).json(this.res)
    } catch (error: any) {
      this.res.code = 500
      this.res.status = 'Error'
      this.res.message = 'Internal server error'

      return response.status(this.res.code).json(this.res)
    }
  }

  private async getTotalDefinition(userId: number, statusId: number): Promise<any> {
    return Database.from('definitions')
      .count('* as total')
      .where('user_id', userId)
      .where('status_definition_id', statusId)
      .first()
  }
}
