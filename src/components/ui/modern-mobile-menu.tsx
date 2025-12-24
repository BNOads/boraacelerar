import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Target, TrendingUp, Video, Settings } from 'lucide-react';

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
    label: string;
    icon: IconComponentType;
    path: string;
}

export interface InteractiveMenuProps {
    items?: InteractiveMenuItem[];
    accentColor?: string;
}

const defaultItems: InteractiveMenuItem[] = [
    { label: 'Início', icon: Home, path: '/dashboard' },
    { label: 'Metas', icon: Target, path: '/metas' },
    { label: 'Painel', icon: TrendingUp, path: '/resultados' },
    { label: 'Membros', icon: Video, path: '/membros' },
    { label: 'Perfil', icon: Settings, path: '/configuracoes' },
];

const defaultAccentColor = 'var(--component-active-color-default)';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const finalItems = useMemo(() => {
        const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
        if (!isValid) {
            return defaultItems;
        }
        return items;
    }, [items]);

    // Find active index based on current path
    const activeIndex = useMemo(() => {
        const index = finalItems.findIndex(item => location.pathname === item.path);
        return index !== -1 ? index : 0;
    }, [location.pathname, finalItems]);

    const textRefs = useRef<(HTMLElement | null)[]>([]);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const setLineWidth = () => {
            const activeItemElement = itemRefs.current[activeIndex];
            const activeTextElement = textRefs.current[activeIndex];

            if (activeItemElement && activeTextElement) {
                const textWidth = activeTextElement.offsetWidth;
                activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
            }
        };

        setLineWidth();

        window.addEventListener('resize', setLineWidth);
        return () => {
            window.removeEventListener('resize', setLineWidth);
        };
    }, [activeIndex]);

    const handleItemClick = (path: string) => {
        navigate(path);
    };

    const navStyle = useMemo(() => {
        const activeColor = accentColor || defaultAccentColor;
        return { '--component-active-color': activeColor } as React.CSSProperties;
    }, [accentColor]);

    return (
        <nav
            className="menu md:hidden"
            role="navigation"
            style={navStyle}
        >
            {finalItems.map((item, index) => {
                const isActive = index === activeIndex;

                const IconComponent = item.icon;

                return (
                    <button
                        key={item.label}
                        className={`menu__item ${isActive ? 'active' : ''}`}
                        onClick={() => handleItemClick(item.path)}
                        ref={(el) => (itemRefs.current[index] = el)}
                        style={{ '--lineWidth': '0px' } as React.CSSProperties}
                    >
                        <div className="menu__icon">
                            <IconComponent className="icon" />
                        </div>
                        <strong
                            className={`menu__text ${isActive ? 'active' : ''}`}
                            ref={(el) => (textRefs.current[index] = el)}
                        >
                            {item.label}
                        </strong>
                    </button>
                );
            })}
        </nav>
    );
};

export { InteractiveMenu };
