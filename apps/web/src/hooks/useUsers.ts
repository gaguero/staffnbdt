import { useQuery } from '@tanstack/react-query';
import { userService, UserFilter } from '../services/userService';

export function useUsers(filter?: UserFilter) {
  return useQuery({
    queryKey: ['users', filter],
    queryFn: () => userService.getUsers(filter),
    select: (data) => data,
  });
}

export default useUsers;