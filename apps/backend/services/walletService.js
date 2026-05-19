const Driver = require('../models/Driver');
const User = require('../models/User');

/**
 * Simulate processing a payment through local Afghan mobile money providers.
 * Real implementation would require hitting the specific provider's API.
 */
exports.processLocalTopUp = async (driverId, amountAfn, provider) => {
  try {
    console.log(`[Wallet Service] Processing ${amountAfn} AFN top-up via ${provider} for Driver ${driverId}`);
    
    // Simulate API call delay to HesabPay or AWCC
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Assume payment succeeded in the mock
    const paymentSuccess = true;
    
    if (paymentSuccess) {
      const driver = await Driver.findById(driverId);
      if (!driver) throw new Error('Driver not found');
      
      driver.commissionBalance += amountAfn;
      await driver.save();
      
      return { 
        success: true, 
        message: `Successfully added ${amountAfn} AFN via ${provider}`,
        newBalance: driver.commissionBalance
      };
    } else {
      return { success: false, error: 'Payment gateway rejected the transaction.' };
    }
  } catch (error) {
    console.error(`Local TopUp Error (${provider}):`, error);
    return { success: false, error: 'Failed to process local top-up.' };
  }
};

/**
 * Simulate processing an international Stripe payment to gift rides.
 * e.g., An Afghan in Germany adds balance for their family member in Kabul.
 */
exports.processDiasporaGift = async (riderId, amountUsd) => {
  try {
    console.log(`[Wallet Service] Processing Diaspora Gift of $${amountUsd} via Stripe for Rider ${riderId}`);
    
    // Simulate Stripe API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Convert USD to AFN (e.g. 1 USD = 70 AFN)
    const conversionRate = 70;
    const amountAfn = amountUsd * conversionRate;

    // In the real app, we might need a wallet balance field on the User schema too
    // For now, let's just log it or simulate updating the user.
    const user = await User.findById(riderId);
    if (!user) throw new Error('Rider not found');
    
    // user.walletBalance = (user.walletBalance || 0) + amountAfn;
    // await user.save();

    return {
      success: true,
      message: `Successfully gifted ${amountAfn} AFN ($${amountUsd}) to rider ${user.phoneNumber}.`,
      addedAfn: amountAfn
    };

  } catch (error) {
    console.error('Diaspora Gifting Error:', error);
    return { success: false, error: 'Failed to process international payment.' };
  }
};
