import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ErrorCode, ServerDataFormat } from '@not_stone/shared';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
//统一返回数据的格式
@Injectable()
export class GlobalInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		// 如果请求是init-account，则不统一格式，直接返回
		if (request.url.includes('init-account')) {
			return next.handle();
		}

		return next.handle().pipe(
			map(data => {
				const result: ServerDataFormat = {
					code: data?.code ?? ErrorCode.SUCCESS,
					message: data?.message ?? 'ok',
					data
				};
				return result;
			})
		);
	}
}
