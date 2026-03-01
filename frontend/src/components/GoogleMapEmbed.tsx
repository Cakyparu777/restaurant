import React from 'react';

interface GoogleMapEmbedProps {
    address?: string;
    restaurantName?: string;
    className?: string;
}

export default function GoogleMapEmbed({ address, restaurantName, className = "" }: GoogleMapEmbedProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || (!address && !restaurantName)) {
        return null;
    }

    // Build the query array for the Maps Embed API
    const queryParts = [];
    if (restaurantName) queryParts.push(restaurantName);
    if (address) queryParts.push(address);

    // Create URL-encoded query string for the embed iframe
    const q = encodeURIComponent(queryParts.join(", "));
    const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}`;

    return (
        <div className={`w-full overflow-hidden rounded-2xl ${className}`}>
            <iframe
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={mapSrc}
            />
        </div>
    );
}
