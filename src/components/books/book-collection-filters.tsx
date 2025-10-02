import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { AudioFilterSwitch } from '@/components/ui/audio-filter-switch';

export interface BookCollectionFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearchBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    audioFilter: boolean | undefined;
    onAudioFilterChange: (checked: boolean) => void;
    disabled?: boolean;
    searchInputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Filter controls for the book collection including search input and audio filter.
 * Memoized to prevent unnecessary re-renders that cause focus loss.
 * 
 * @param props - Component props
 * @param props.searchTerm - Current search term value
 * @param props.onSearchChange - Handler for search input changes
 * @param props.onSearchBlur - Handler for search input blur event
 * @param props.audioFilter - Current audio filter state
 * @param props.onAudioFilterChange - Handler for audio filter toggle
 * @param props.disabled - Whether filters are disabled (e.g., during loading)
 * @param props.searchInputRef - Optional ref for the search input element
 * 
 * @example
 * ```tsx
 * <BookCollectionFilters
 *   searchTerm={searchTerm}
 *   onSearchChange={handleSearch}
 *   onSearchBlur={handleSearchBlur}
 *   audioFilter={filters.hasAudio}
 *   onAudioFilterChange={handleAudioFilterChange}
 *   disabled={isLoading}
 *   searchInputRef={searchInputRef}
 * />
 * ```
 */
export const BookCollectionFilters = memo(function BookCollectionFilters({
    searchTerm,
    onSearchChange,
    onSearchBlur,
    audioFilter,
    onAudioFilterChange,
    disabled = false,
    searchInputRef,
}: BookCollectionFiltersProps) {
    return (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4 w-full">
            <div className="flex-1">
                <Input
                    ref={searchInputRef}
                    name="searchBooks"
                    placeholder="Cerca racconti..."
                    onChange={(e) => onSearchChange(e.target.value)}
                    onBlur={onSearchBlur}
                    value={searchTerm}
                    disabled={disabled}
                />
            </div>
            <AudioFilterSwitch
                checked={audioFilter}
                onCheckedChange={onAudioFilterChange}
                disabled={disabled}
            />
        </div>
    );
});
