'use client';

import { DEFAULT_PROMO_AUDIO_TYPE } from '@/lib/promo-page-input';
import { ClientSanitizedHtml } from '@/components/promo/ClientSanitizedHtml';

interface PromoAudioTypeLabelProps {
    audioType: string | null | undefined;
    variant: 'title' | 'listen';
    className?: string;
}

export function PromoAudioTypeLabel({ audioType, variant, className }: PromoAudioTypeLabelProps) {
    const label = audioType?.trim() || DEFAULT_PROMO_AUDIO_TYPE;
    const labelClassName = variant === 'listen'
        ? 'inline uppercase [&_p]:m-0 [&_p]:inline'
        : 'inline [&_p]:m-0 [&_p]:inline';

    if (variant === 'listen') {
        return (
            <div className={`${className ?? ''} uppercase`}>
                <span>Ascolta l&apos;</span>
                <ClientSanitizedHtml
                    html={label}
                    className={labelClassName}
                />
            </div>
        );
    }

    return (
        <div className={className}>
            <ClientSanitizedHtml
                html={label}
                className={labelClassName}
            />{' '}
            <span>audio</span>
        </div>
    );
}
