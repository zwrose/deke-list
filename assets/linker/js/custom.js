// Use this file for small custom scripts
// It will show up after jquery and bootstrap, unless you changed things in the Gruntfile otherwise
$(".passinfo").qtip({
	prerender: true,
	content: {
		text: 'This passphrase helps us control access to our closed site. If you are a brother and have not yet received the passphrase, please email astadke@gmail.com.'
	},
	position: {
    target: 'mouse',
    adjust: {
        mouse: true
    }
  },
  style: {
    classes: 'qtip-light'
  }
})