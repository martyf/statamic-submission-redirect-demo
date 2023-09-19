<p align="center"><img src="https://statamic.com/assets/branding/Statamic-Logo+Wordmark-Rad.svg" width="400" alt="Statamic Logo" /></p>

# Submission Redirect PR demo

This demo site is to show how to use a Submission redirect in Statamic
for [this pull request](https://github.com/statamic/cms/pull/8729).

## What it does

> Adds support for a "redirect" to be built based on the Submission data.

A use case is to redirect to a third-party platform, like Stripe, that may need its redirect URL to be
constructed based on data within the Submission itself (and would not have been known at form-render time).

This has been built to work with both standard POST requests, as well as AJAX (but will be up to the developer to look
for the new `redirect` parameter in the JSON response).

### But forms already have redirects!

Yeah, they do, but only at the time of form-render. This is to allow submission data to influence the redirect URL.

### What about events?

For an AJAX approach, you need to return the redirect target to the frontend - you can't do that with events.

## How it does it

The `Statamic\Forms\Submission` object now has a `getRedirectUrl` method that returns the Submission's redirect URL.
This is called in the `Statamic\Http\Controllers\FormController` controller.

The `Submission` also has a `buildRedirectUrl` method where a dev can place their own logic for building a redirect URL.
See the [Configure your redirect](#configure-your-redirect) section. This is all a dev would need to write.

Users can still use a `_redirect` parameter with the `form` tag, however the `getRedirectUrl` method will take priority
over the `_redirect` param.

The `formSuccess` method of the `FormController` has been updated and now:

1. will call `getRedirectUrl` to get the Submission's redirect (or `null` if there is not one)
2. if there is no redirect, will check for a `_redirect` param
3. if an AJAX request, now includes a `redirect` property with the value of the redirect (for the developer to look for)
4. if not an AJAX request, and a redirect exists, will return the redirect response (i.e. Laravel will do the redirect)

### Note about POST submissions

If the Submission has a redirect, there is **no** submission data flashed to the session.

It could/should be assumed that if you're redirecting away that is is the third party platform's responsibility to
redirect *back* to the site and could either pass URL parameters or have a `target` URL provided as part of the build
process.

In a perfect pass - i.e. submit form, redirect, complete on third party, redirect back - having flashed data is handy.
However if something doesn't go that way - i.e. submit form, redirect, user clicks "back" - the form template could then
show flash data for the incomplete submission which is not ideal.

This is why this PR only flashes data to the session if there is **no** redirect.

## How to use this demo

The usual is needed:

- clone this repo,
- `composer install`
- set up your `.env`
- `npm install`
- `npm run dev`

If you need a user, `php please make:user`

Nothing too fancy there.

Visit the site in your browser to see a page that has two versions of the same form - one set up for a POST submission,
the other for an AJAX submission.

## Forms

Devs would create their form as per normal. There is no change to the form creation process for both the CP or the
frontend.

## Configure your Redirect

To configure a Submission redirect, the developer will need to re-bind Statamic's `Statamic\Forms\Submission` to their
own Submission object that extends Statamic's.

### Create your own Submission

```php
<?php

namespace App\Forms;

class Submission extends \Statamic\Forms\Submission {

    public function buildRedirectUrl(): void
    {
        // do something to set this submission's URL
        // if you need a redirect, set the full URL to be $this->redirect
    }
}

```

Within the `buildRedirectUrl`, you can make your redirect URL based on whatever conditions you need, such as:

- checking for the form handle
- checking for another param in the submission to conditionally have a redirect created
- on existance of a specific fieldtype (sounds weird, but imagine you've made a "StripeProducts" fieldtype)

#### Checking for the form handle

Build the redirect if the form handle is `form_handle_that_needs_redirect`.

```php
public function buildRedirectUrl(): void
{
    if ($this->form->handle() === 'form_handle_that_needs_redirect') {
        $this->redirect = 'https://statamic.com';
    }
}
```

#### Conditional based on a submission param

Build the redirect if we have a `redirect` param in the Submission and it is `true`.

```php
public function buildRedirectUrl(): void
{
    if ($this->get('redirect') === true) {
        $this->redirect = 'https://statamic.com';
    }
}
```

#### Conditional based on a existance of a fieldtype

Build the redirect if we have a fieldtype of type `special_fieldtype` in the form's blueprint.

```php
public function buildRedirectUrl(): void
{
    if ($this->form
        ->blueprint()
        ->fields()
        ->items()
        ->filter(fn($field) => $field['field']['type'] === 'special_fieldtype')
        ->count()) {
        $this->redirect = 'https://statamic.com';
    }
}
```

#### Combination of some the above

Build the redirect only when the form handle is `form_handle_that_needs_redirect` and the `redirect` param is `true`.

```php
public function buildRedirectUrl(): void
{
    if ($this->form->handle() === 'form_handle_that_needs_redirect') {
        if ($this->get('redirect') === true) {
            $this->redirect = 'https://statamic.com';
        }
    }
}
```

The jist is: when building your redirect, simply set `$this->redirect` to be your target:

```php
$this->redirect = 'https://statamic.com'
```

The value of `$this->redirect` will be returned by the Submission's `getRedirectUrl` method.

By default it is null (meaning no redirect).

### Bind your Submission

In your `AppServiceProvider`:

```php
app()->bind(
    \Statamic\Forms\Submission::class,
    \App\Forms\Submission::class
);
```

And you're good to go.

## Opinion

So, this works. But I don't totally love it. I don't like the idea of having to re-bind a class just to get this level
of functionality in place.

What would be awesome would be to hook in to the Submission's `afterSave` callbacks but I'm not entirely sure how to
approach that. I managed to get `afterSave` in the Submission's Facade for something like this:

```php
Submission::afterSave(function(){
    // build the redirect URL
});
```

but things don't work that way - they were never called. Unless I'm missing some other approach that could achieve this?

A benefit of a new class is that it would make Unit testing potentially easier. That's a plus. 
