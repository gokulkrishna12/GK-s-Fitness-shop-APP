# 🏋️‍♂️ GK's Fitness Shop

A premium mobile e-commerce application for gym gear, supplements, and fitness accessories. Built with React Native and Expo, featuring seamless payment integration and real-time order tracking.

## ✨ Key Features
* **Secure Authentication:** User login and registration with state management.
* **Product Catalog:** Browse categories like Whey Proteins, Creatine, Gym Equipment, and more.
* **Cart & Wishlist:** Dynamic state management that instantly syncs and clears upon logout.
* **Seamless Checkout:** Fully integrated with **Razorpay** for secure payments.
* **Order Management:** Track order status, view history, and cancel active orders directly from the app.
* **Over-The-Air Updates:** Configured with EAS Update for instant JavaScript code pushes without full APK rebuilds.

## 🛠️ Tech Stack
* **Frontend:** React Native, Expo Router, Lucide-React-Native
* **Backend:** Node.js, Express, MongoDB (Deployed on AWS EC2 & RDS)
* **Payments:** Razorpay (`react-native-razorpay`)
* **Deployment & CI/CD:** Expo Application Services (EAS Build & EAS Update)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed and the Expo CLI configured globally.

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/gks-fitness-shop.git](https://github.com/your-username/gks-fitness-shop.git)
Navigate to the project directory:

Bash
cd MyApp
Install dependencies:

Bash
npm install
Start the Expo development server:

Bash
npx expo start
📦 Building for Android
This project is configured for EAS builds. To generate a standalone APK:

Bash
eas build -p android --profile preview
🔄 Pushing OTA Updates
To push instant JavaScript/UI changes to installed apps without rebuilding the APK:

Bash
eas update --branch preview --message "Your update message here"
Developed by GokulKrishna | 2026