'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type CheckedState = boolean | 'indeterminate';

export interface User {
    id: number;
    email: string;
    fullName: string;
    isActivated: boolean;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UsersResponse {
    users: User[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}



export function UsersTable() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<keyof User>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isActivatedFilter, setIsActivatedFilter] = useState<boolean | null>(null);
    const [isAdminFilter, setIsAdminFilter] = useState<boolean | null>(null);

    const fetchUsers = useCallback(async (): Promise<UsersResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            perPage: perPage.toString(),
            search,
            sortBy: sortBy as string,
            sortOrder,
            ...(isActivatedFilter !== null && { isActivated: isActivatedFilter.toString() }),
            ...(isAdminFilter !== null && { isAdmin: isAdminFilter.toString() }),
        });

        const response = await fetch(`/api/users?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }, [page, perPage, search, sortBy, sortOrder, isActivatedFilter, isAdminFilter]);

    const { data, isLoading, error } = useQuery<UsersResponse, Error>({
        queryKey: ['users', { page, perPage, search, sortBy, sortOrder, isActivatedFilter, isAdminFilter }],
        queryFn: fetchUsers,
        placeholderData: (previousData) => previousData, // Keeps previous data while fetching
        retry: 1, // Only retry once on failure
    });

    // Type guard to check if the error is an Error object
    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        return 'An unknown error occurred';
    };

    const handleSort = (column: keyof User) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const SortIcon = useMemo(() => {
        const SortIconComponent = ({ column }: { column: keyof User }) => (
            <span className="ml-1">
                {sortBy === column ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
            </span>
        );
        SortIconComponent.displayName = 'SortIcon';
        return SortIconComponent;
    }, [sortBy, sortOrder]);

    // Get users and pagination data with defaults
    const users = data?.users || [];
    const pagination = data?.pagination || {
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 1
    };
    const { total, totalPages } = pagination;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search users..."
                        className="w-full pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="activated-filter"
                            checked={isActivatedFilter === true}
                            onCheckedChange={(checked: CheckedState) => setIsActivatedFilter(checked === true ? true : null)}
                        />
                        <label htmlFor="activated-filter" className="text-sm">Active</label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="admin-filter"
                            checked={isAdminFilter === true}
                            onCheckedChange={(checked: CheckedState) => setIsAdminFilter(checked === true ? true : null)}
                        />
                        <label htmlFor="admin-filter" className="text-sm">Admin</label>
                    </div>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleSort('email')}
                            >
                                Email <SortIcon column="email" />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleSort('fullName')}
                            >
                                Name <SortIcon column="fullName" />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent text-center"
                                onClick={() => handleSort('isActivated')}
                            >
                                Status <SortIcon column="isActivated" />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent text-center"
                                onClick={() => handleSort('isAdmin')}
                            >
                                Role <SortIcon column="isAdmin" />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent text-end"
                                onClick={() => handleSort('createdAt')}
                            >
                                Joined <SortIcon column="createdAt" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    Loading users...
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-destructive">
                                    Error loading users: {getErrorMessage(error)}
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user: User) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActivated
                                            ? 'bg-green-200 text-green-900'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.isActivated ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isAdmin
                                            ? 'bg-purple-400 text-purple-950'
                                            : 'bg-slate-400 text-slate-950'
                                            }`}>
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground text-end">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.perPage + 1}</span> to{' '}
                    <span className="font-medium">
                        {Math.min(pagination.page * pagination.perPage, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> user{pagination.total !== 1 ? 's' : ''}
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${perPage}`}
                            onValueChange={(value) => {
                                setPerPage(Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={perPage} />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 30, 40, 50].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {page} of {totalPages}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
