import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getArchives, getCurArchive, setCurArchive } from '@/services/not_stone';
import { ConfigDataTable } from '@/views/Main/components/config-data-table';
import { type DataTableConfig } from '@/views/Main/components/config-data-table/config.type';
import { DataTableColumnHeader } from '@/views/Main/components/config-data-table/data-table/columns/header';
import { PageHeader } from '@/views/Main/components/PageHeader';
import { type GameArchive } from '@not_stone/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useCustomMutation, useCustomQuery } from '../../../query/config';
import { ArchiveCreate } from './ArchiveCreate';

const GameArchivePage: React.FC = () => {
	const queryClient = useQueryClient();

	const { data: archivesData, status: archivesStatus } = useCustomQuery(['archives'], getArchives);

	const { data: curArchiveData, status: curArchiveStatus } = useCustomQuery(
		['cur_archive'],
		getCurArchive
	);

	const setCurArchiveMutation = useCustomMutation(setCurArchive, {
		onSuccess: () => {
			toast.success('设置当前档案成功');
			queryClient.invalidateQueries({ queryKey: ['cur_archive'] });
			queryClient.invalidateQueries({ queryKey: ['archives'] }); // Refresh list to update UI state if needed
		},
		onError: () => {
			toast.error('设置当前档案失败');
		}
	});

	if (archivesStatus === 'pending') {
		return <div>加载中...</div>;
	}

	if (archivesStatus === 'error') {
		return <div>加载档案列表失败</div>;
	}

	const archives = archivesData?.data || [];
	const curArchive = curArchiveData?.data;

	const dataTableConfig: DataTableConfig<GameArchive> = {
		columns: {
			dataCols: [
				{
					accessorKey: 'name',
					header: ({ column }) => <DataTableColumnHeader column={column} title="档案名称" />,
					cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
				},
				{
					accessorKey: 'role_name',
					header: ({ column }) => <DataTableColumnHeader column={column} title="角色" />,
					cell: ({ row }) => <div>{row.original.role_name}</div>
				},
				{
					accessorKey: 'create_at',
					header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
					cell: ({ row }) => {
						const date = row.original.create_at
							? new Date(row.original.create_at).toLocaleDateString()
							: '未知';
						return <div className="text-sm text-gray-500">{date}</div>;
					}
				},
				{
					accessorKey: 'status',
					header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
					cell: ({ row }) => {
						const isCurrent = curArchive?.id === row.original.id;
						if (isCurrent) {
							return (
								<Badge
									variant="secondary"
									className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
								>
									<Check className="w-3 h-3 mr-1" />
									当前使用
								</Badge>
							);
						}
						return null;
					}
				}
			],
			rowActionsCol: [
				{
					id: 'actions',
					cell: ({ row }) => {
						const isCurrent = curArchive?.id === row.original.id;
						return (
							<Button
								variant="ghost"
								size="sm"
								disabled={isCurrent || setCurArchiveMutation.isPending}
								onClick={() => setCurArchiveMutation.mutate(row.original.id)}
							>
								{isCurrent ? '档案已启用' : '启用此档案'}
							</Button>
						);
					}
				}
			],
			selectCol: []
		},
		options: {
			toolbar: {
				enable: true,
				searchColIds: ['name']
			},
			pagination: {
				enable: archives.length > 10
			}
		},
		createBtn: <ArchiveCreate />
	};

	return (
		<>
			<PageHeader
				title="档案管理"
				description="为您的游戏存档建立并启用一个档案，每个存档应该对应唯一的档案。如果您切换到另一个存档，就需要为它启用另一个档案。"
			/>
			<div className="pl-10 pr-10">
				{curArchive && (
					<div className="mb-6 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
						<h3 className="text-lg font-semibold mb-2">当前正在使用的档案</h3>
						<div className="flex gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">名称：</span>
								{curArchive.name}
							</div>
							<div>
								<span className="text-muted-foreground">角色：</span>
								{curArchive.role_name}
							</div>
							<div>
								<span className="text-muted-foreground">ID：</span>
								{curArchive.id}
							</div>
						</div>
					</div>
				)}
				<ConfigDataTable data={archives} dataTableConfig={dataTableConfig} />
			</div>
		</>
	);
};

export default GameArchivePage;
