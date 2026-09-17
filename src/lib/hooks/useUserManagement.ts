import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  AdvancedFilters,
  Pagination,
  UserStats,
  SearchMode,
} from "@/src/types/user-management";

interface UseUsersResult {
  users: User[];
  loading: boolean;
  filtering: boolean;
  pagination: Pagination;
  stats: UserStats;
  searchMode: SearchMode;
  basicSearch: string;
  advancedFilters: AdvancedFilters;
  setSearchMode: (mode: SearchMode) => void;
  setBasicSearch: (value: string) => void;
  setAdvancedFilters: (
    updater: AdvancedFilters | ((prev: AdvancedFilters) => AdvancedFilters)
  ) => void;
  setPagination: (
    updater: Pagination | ((prev: Pagination) => Pagination)
  ) => void;
  refetchUsers: () => void;
  updateURL: () => void;
  handleSort: (field: string) => void;
}

export function useUsers(): UseUsersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search mode: 'simple' or 'advanced'
  const [searchMode, setSearchMode] = useState<SearchMode>(() => {
    // Auto-set to advanced if any advanced filters are in URL
    const hasAdvancedFilters = !!(
      searchParams.get("givenName") ||
      searchParams.get("familyName") ||
      searchParams.get("email") ||
      searchParams.get("gender") ||
      searchParams.get("birthYearMin") ||
      searchParams.get("birthYearMax") ||
      searchParams.get("birthCountries") ||
      searchParams.get("residenceCountries") ||
      searchParams.get("role") ||
      searchParams.get("status") ||
      searchParams.get("forumNickname") ||
      searchParams.get("createdDateFrom") ||
      searchParams.get("createdDateTo") ||
      searchParams.get("updatedDateFrom") ||
      searchParams.get("updatedDateTo")
    );
    return hasAdvancedFilters ? "advanced" : "simple";
  });

  const [basicSearch, setBasicSearch] = useState(
    searchParams.get("search") || ""
  );

  const [pagination, setPagination] = useState<Pagination>({
    page: parseInt(searchParams.get("page") || "1"),
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });

  const [stats, setStats] = useState<UserStats>({
    activeCount: 0,
    adminCount: 0,
  });

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    givenName: searchParams.get("givenName") || "",
    familyName: searchParams.get("familyName") || "",
    email: searchParams.get("email") || "",
    gender: searchParams.get("gender") || "",
    birthYearMin: searchParams.get("birthYearMin") || "",
    birthYearMax: searchParams.get("birthYearMax") || "",
    birthCountry:
      searchParams.get("birthCountries")?.split(",").filter(Boolean) || [],
    residenceCountry:
      searchParams.get("residenceCountries")?.split(",").filter(Boolean) || [],
    role: searchParams.get("role") || "",
    status: searchParams.get("status") || "",
    forumNickname: searchParams.get("forumNickname") || "",
    notes: searchParams.get("notes") || "",
    createdDateFrom: searchParams.get("createdDateFrom") || "",
    createdDateTo: searchParams.get("createdDateTo") || "",
    updatedDateFrom: searchParams.get("updatedDateFrom") || "",
    updatedDateTo: searchParams.get("updatedDateTo") || "",
    sortBy: searchParams.get("sortBy") || "givenName",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    showRetired: searchParams.get("showRetired") === "true",
    showDeceased: searchParams.get("showDeceased") === "true",
  });

  const updateURL = () => {
    const params = new URLSearchParams();

    // Add page if not 1
    if (pagination.page !== 1) {
      params.set("page", pagination.page.toString());
    }

    // Only add filters from the active search mode
    if (searchMode === "simple" && basicSearch.trim()) {
      params.set("search", basicSearch.trim());
    } else if (searchMode === "advanced") {
      // Add advanced filters
      if (advancedFilters.givenName.trim()) {
        params.set("givenName", advancedFilters.givenName.trim());
      }
      if (advancedFilters.familyName.trim()) {
        params.set("familyName", advancedFilters.familyName.trim());
      }
      if (advancedFilters.email.trim()) {
        params.set("email", advancedFilters.email.trim());
      }
      if (advancedFilters.gender) {
        params.set("gender", advancedFilters.gender);
      }
      if (advancedFilters.birthYearMin) {
        params.set("birthYearMin", advancedFilters.birthYearMin);
      }
      if (advancedFilters.birthYearMax) {
        params.set("birthYearMax", advancedFilters.birthYearMax);
      }
      if (advancedFilters.birthCountry.length > 0) {
        params.set("birthCountries", advancedFilters.birthCountry.join(","));
      }
      if (advancedFilters.residenceCountry.length > 0) {
        params.set(
          "residenceCountries",
          advancedFilters.residenceCountry.join(",")
        );
      }
      if (advancedFilters.role) {
        params.set("role", advancedFilters.role);
      }
      if (advancedFilters.status) {
        params.set("status", advancedFilters.status);
      }
      if (advancedFilters.forumNickname.trim()) {
        params.set("forumNickname", advancedFilters.forumNickname.trim());
      }
      if (advancedFilters.notes.trim()) {
        params.set("notes", advancedFilters.notes.trim());
      }
      if (advancedFilters.createdDateFrom) {
        params.set("createdDateFrom", advancedFilters.createdDateFrom);
      }
      if (advancedFilters.createdDateTo) {
        params.set("createdDateTo", advancedFilters.createdDateTo);
      }
      if (advancedFilters.updatedDateFrom) {
        params.set("updatedDateFrom", advancedFilters.updatedDateFrom);
      }
      if (advancedFilters.updatedDateTo) {
        params.set("updatedDateTo", advancedFilters.updatedDateTo);
      }
      if (advancedFilters.showRetired) {
        params.set("showRetired", "true");
      }
      if (advancedFilters.showDeceased) {
        params.set("showDeceased", "true");
      }

      // Include sort params only in advanced mode
      if (advancedFilters.sortBy) {
        params.set("sortBy", advancedFilters.sortBy);
      }
      if (advancedFilters.sortOrder) {
        params.set("sortOrder", advancedFilters.sortOrder);
      }
    }

    // Store the currently focused element before URL update
    const activeElement = document.activeElement as HTMLElement;
    const shouldRestoreFocus =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "SELECT" ||
        activeElement.tagName === "TEXTAREA");

    // Update URL without navigation/re-render using router.replace with shallow routing
    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/users";
    router.replace(newUrl, { scroll: false });

    // Restore focus after URL update
    if (shouldRestoreFocus && activeElement) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        activeElement.focus();
        // For text inputs, restore cursor position
        if (
          activeElement instanceof HTMLInputElement &&
          activeElement.type === "text"
        ) {
          const cursorPos = activeElement.selectionStart;
          if (cursorPos !== null) {
            activeElement.setSelectionRange(cursorPos, cursorPos);
          }
        }
      }, 0);
    }
  };

  const fetchUsers = async () => {
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Use filtering state for background updates, loading for initial load
    if (users.length > 0) {
      setFiltering(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      // Only add filters from the active search mode
      if (searchMode === "simple" && basicSearch.trim()) {
        params.append("search", basicSearch.trim());
      } else if (searchMode === "advanced") {
        // Add advanced filters
        if (advancedFilters.givenName.trim()) {
          params.append("givenName", advancedFilters.givenName.trim());
        }
        if (advancedFilters.familyName.trim()) {
          params.append("familyName", advancedFilters.familyName.trim());
        }
        if (advancedFilters.email.trim()) {
          params.append("email", advancedFilters.email.trim());
        }
        if (advancedFilters.gender) {
          params.append("gender", advancedFilters.gender);
        }
        if (advancedFilters.birthYearMin) {
          params.append("birthYearMin", advancedFilters.birthYearMin);
        }
        if (advancedFilters.birthYearMax) {
          params.append("birthYearMax", advancedFilters.birthYearMax);
        }
        if (advancedFilters.birthCountry.length > 0) {
          advancedFilters.birthCountry.forEach((code) => {
            params.append("birthCountry", code);
          });
        }
        if (advancedFilters.residenceCountry.length > 0) {
          advancedFilters.residenceCountry.forEach((code) => {
            params.append("residenceCountry", code);
          });
        }
        if (advancedFilters.role) {
          params.append("role", advancedFilters.role);
        }
        if (advancedFilters.status) {
          params.append("status", advancedFilters.status);
        }
        if (advancedFilters.forumNickname.trim()) {
          params.append("forumNickname", advancedFilters.forumNickname.trim());
        }
        if (advancedFilters.notes.trim()) {
          params.append("notes", advancedFilters.notes.trim());
        }
        if (advancedFilters.createdDateFrom) {
          params.append("createdDateFrom", advancedFilters.createdDateFrom);
        }
        if (advancedFilters.createdDateTo) {
          params.append("createdDateTo", advancedFilters.createdDateTo);
        }
        if (advancedFilters.updatedDateFrom) {
          params.append("updatedDateFrom", advancedFilters.updatedDateFrom);
        }
        if (advancedFilters.updatedDateTo) {
          params.append("updatedDateTo", advancedFilters.updatedDateTo);
        }
        if (advancedFilters.showRetired) {
          params.append("showRetired", "true");
        }
        if (advancedFilters.showDeceased) {
          params.append("showDeceased", "true");
        }

        // Include sort params only in advanced mode
        if (advancedFilters.sortBy) {
          params.append("sortBy", advancedFilters.sortBy);
        }
        if (advancedFilters.sortOrder) {
          params.append("sortOrder", advancedFilters.sortOrder);
        }
      }

      const response = await fetch(`/api/users?${params.toString()}`, {
        signal: abortController.signal,
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error: any) {
      // Ignore abort errors - they're expected when cancelling requests
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  };

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce: 300ms for text inputs, immediate for dropdowns/dates
    const hasTextFilter =
      basicSearch.trim() !== "" ||
      advancedFilters.givenName.trim() !== "" ||
      advancedFilters.familyName.trim() !== "" ||
      advancedFilters.email.trim() !== "" ||
      advancedFilters.forumNickname.trim() !== "";

    const debounceTime = hasTextFilter ? 300 : 0;

    const timer = setTimeout(() => {
      updateURL();
      fetchUsers();
    }, debounceTime);

    return () => {
      clearTimeout(timer);
      // Cancel request when component unmounts or dependencies change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [basicSearch, advancedFilters, pagination.page, pagination.limit]);

  const handleSort = (field: string) => {
    setAdvancedFilters((prev) => {
      // If clicking the same field, toggle direction
      if (prev.sortBy === field) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
        };
      }
      // If clicking a new field, set it with ascending order
      return {
        ...prev,
        sortBy: field,
        sortOrder: "asc",
      };
    });
    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return {
    users,
    loading,
    filtering,
    pagination,
    stats,
    searchMode,
    basicSearch,
    advancedFilters,
    setSearchMode,
    setBasicSearch,
    setAdvancedFilters,
    setPagination,
    refetchUsers: fetchUsers,
    updateURL,
    handleSort,
  };
}

export function useCountries() {
  const [countries, setCountries] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const hasInitializedCountries = useRef(false);

  useEffect(() => {
    const fetchCountries = async () => {
      // Only fetch countries once
      if (hasInitializedCountries.current) return;
      hasInitializedCountries.current = true;

      try {
        const response = await fetch("/api/countries");
        if (response.ok) {
          const data = await response.json();
          setCountries(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        setCountries([]);
      }
    };

    fetchCountries();
  }, []);

  return countries;
}
