import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { createArchive } from '@/services/not_stone';
import { zodResolver } from '@hookform/resolvers/zod';
import { cnNameToEnglish, LLMCanUse } from '@prisma-ai/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCustomMutation } from '../../../query/config';

const formSchema = z.object({
	archiveName: z.string().min(1, '档案名称不能为空'),
	roleName: z.string().min(1, '请选择角色'),
	llm_type: z.nativeEnum(LLMCanUse, {
		required_error: '请选择模型'
	}),
	apiKey: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export const ArchiveCreate: React.FC = () => {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const mutation = useCustomMutation(createArchive, {
		onSuccess: res => {
			const apiKey = localStorage.getItem('not_stone_apiKey');
			const dataToCopy = { ...res.data };
			if (apiKey) {
				dataToCopy.modelConfig.api_key = apiKey;
			}
			const dataString = JSON.stringify(dataToCopy);
			navigator.clipboard.writeText(dataString);
			toast.success('档案创建成功', {
				description: `档案数据已复制到剪切板`,
				action: {
					label: '关闭',
					onClick: () => {}
				},
				duration: Infinity
			});
			queryClient.invalidateQueries({ queryKey: ['archives'] });
			setOpen(false);
		}
	});

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			archiveName: '',
			roleName: '',
			llm_type: LLMCanUse.v3,
			apiKey: localStorage.getItem('not_stone_apiKey') || ''
		}
	});

	const onSubmit = (values: FormValues) => {
		if (values.apiKey) {
			localStorage.setItem('not_stone_apiKey', values.apiKey);
		}
		mutation.mutate({
			archiveName: values.archiveName,
			roleName: values.roleName as keyof typeof cnNameToEnglish,
			llm_type: values.llm_type
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>新建档案</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>创建新档案</DialogTitle>
					<DialogDescription>创建一个新的游戏存档，选择角色和AI模型。</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="archiveName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>档案名称</FormLabel>
									<FormControl>
										<Input placeholder="请输入档案名称" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="roleName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>角色</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="选择角色" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.keys(cnNameToEnglish).map(role => (
												<SelectItem key={role} value={role}>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="llm_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>AI模型</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="选择模型" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(LLMCanUse).map(model => (
												<SelectItem key={model} value={model}>
													{model}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="apiKey"
							render={({ field }) => (
								<FormItem>
									<FormLabel>API Key (仅本地存储)</FormLabel>
									<FormControl>
										<Input type="password" placeholder="请输入 API Key" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end pt-4">
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending ? '创建中...' : '创建'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
