import React from 'react';
import {
	type LucideIcon,
	Frown,
	Meh,
	Smile,
	AlertCircle,
	Droplets,
	Wind,
	CheckCircle,
	CloudRain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface HumidityRatingProps {
	humidity: number;
}

interface HumidityStatus {
	message: string;
	icon: LucideIcon;
	color: string;
}

interface HumidityRating {
	range: string;
	feeling: string;
	icon: LucideIcon;
	color: string;
}

const humidityRatings: HumidityRating[] = [
	{
		range: '0-29%',
		feeling: 'Too dry',
		icon: AlertCircle,
		color: 'text-red-500',
	},
	{
		range: '30-50%',
		feeling: 'Ideal',
		icon: Smile,
		color: 'text-green-500',
	},
	{
		range: '51-60%',
		feeling: 'A bit humid',
		icon: Meh,
		color: 'text-yellow-500',
	},
	{
		range: '61-70%',
		feeling: 'Uncomfortable',
		icon: Meh,
		color: 'text-orange-500',
	},
	{
		range: '71-100%',
		feeling: 'Too humid',
		icon: Frown,
		color: 'text-red-500',
	}
];

const getHumidityStatus = (humidity: number): HumidityStatus => {
	if (humidity < 30) {
		return {
			message: 'Consider using a humidifier',
			icon: Wind,
			color: 'text-red-600',
		};
	}
	if (humidity < 51) {
		return {
			message: 'Perfect humidity level',
			icon: CheckCircle,
			color: 'text-green-600',
		};
	}
	if (humidity < 61) {
		return {
			message: 'Slightly humid',
			icon: Droplets,
			color: 'text-yellow-600',
		};
	}
	if (humidity < 71) {
		return {
			message: 'Getting uncomfortable',
			icon: AlertCircle,
			color: 'text-orange-600',
		};
	}
	return {
		message: 'Very humid, consider dehumidifying',
		icon: CloudRain,
		color: 'text-red-600',
	};
};

const getHumidityRating = (humidity: number): HumidityRating => {
	if (humidity < 30) {
		return humidityRatings[0];
	}

	if (humidity < 51) {
		return humidityRatings[1];
	}

	if (humidity < 61) {
		return humidityRatings[2];
	}

	if (humidity < 71) {
		return humidityRatings[3];
	}

	return humidityRatings[4];
};

const getHumidityStatusStyles = (humidity: number): string => {
	if (humidity < 30) {
		return 'bg-red-50 text-red-800';
	}

	if (humidity < 51) {
		return 'bg-green-50 text-green-800';
	}

	if (humidity < 61) {
		return 'bg-yellow-50 text-yellow-800';
	}

	if (humidity < 71) {
		return 'bg-orange-50 text-orange-800';
	}

	return 'bg-red-50 text-red-800';
};

export const HumidityRating: React.FC<HumidityRatingProps> = ({ humidity }) => {
	const rating = getHumidityRating(humidity);
	const status = getHumidityStatus(humidity);
	const statusStyles = getHumidityStatusStyles(humidity);
	const RatingIcon = rating.icon;
	const StatusIcon = status.icon;

	return (
		<Card className="w-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Droplets className="h-5 w-5 text-blue-500" />
						<CardTitle>Humidity Level</CardTitle>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4">
					<RatingIcon
						size={48}
						className={`${rating.color} transition-transform hover:scale-110`}
					/>
					<div className="text-center">
						<p className="text-lg font-semibold text-gray-900">
							{rating.feeling}
						</p>
						<p className="text-sm text-gray-500">{rating.range}</p>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-xs text-gray-600">
						<span>Too Dry</span>
						<span>Ideal</span>
						<span>Too Humid</span>
					</div>
					<Progress value={humidity} className="h-3" />
					<div className="flex justify-between text-xs text-gray-500">
						<span>0%</span>
						<span>50%</span>
						<span>100%</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 text-xs">
					<div className="rounded-lg bg-red-50 p-2">
						<p className="font-semibold text-red-700">0-29%</p>
						<p className="text-red-600">Too dry</p>
					</div>
					<div className="rounded-lg bg-green-50 p-2">
						<p className="font-semibold text-green-700">30-50%</p>
						<p className="text-green-600">Ideal</p>
					</div>
					<div className="rounded-lg bg-yellow-50 p-2">
						<p className="font-semibold text-yellow-700">51-60%</p>
						<p className="text-yellow-600">A bit humid</p>
					</div>
					<div className="rounded-lg bg-orange-50 p-2">
						<p className="font-semibold text-orange-700">61-70%</p>
						<p className="text-orange-600">Uncomfortable</p>
					</div>
				</div>

				<div className={`flex justify-center items-center gap-3 rounded-lg p-3 text-sm font-medium ${statusStyles}`}>
					<StatusIcon size={20} className="flex-shrink-0" />
					<span>{status.message}</span>
				</div>
			</CardContent>
		</Card>
	);
};
